import type { BankAdapter } from "../../bank.ts";
import type { Account } from "../../contract.ts";
import { parseRawTransactions, shapeMismatch } from "../../raw-transactions.ts";
import { inject, navigate, notLoggedIn, withSyncTab } from "../../sync-tab.ts";
import bank from "./bank.ts";
import { headerV1, rawTransactionV1 } from "./shapes.ts";

const webApp = "https://app.traderepublic.com/";

export function parseCsv(text: string, type: Account["type"]) {
  const [header, ...rows] = quotedRows(text) ?? [];
  if (JSON.stringify(header) !== JSON.stringify(headerV1))
    throw shapeMismatch(bank.name);
  const parsed = parseRawTransactions(
    bank.name,
    rawTransactionV1,
    rows.map((cells) =>
      Object.fromEntries(
        cells.map((cell, index) => [headerV1[index] ?? index, cell]),
      ),
    ),
  );
  // The export holds the cash account's and the depot's rows alike, and the depot's rows are those with an ISIN: trades, dividends and stock perks.
  return type === "depot"
    ? parsed.filter(({ symbol }) => symbol !== "")
    : parsed;
}

function quotedRows(text: string): string[][] | undefined {
  const cell = /"((?:[^"]|"")*)"(,|\n|$)/y;
  const rows: string[][] = [];
  let row: string[] = [];
  while (cell.lastIndex < text.length) {
    const [, quoted, separator] = cell.exec(text) ?? [];
    if (quoted === undefined) return undefined;
    row.push(quoted.replaceAll('""', '"'));
    if (separator === ",") continue;
    rows.push(row);
    row = [];
  }
  return row.length ? undefined : rows;
}

async function exportCsv(
  name: string,
  type: Account["type"],
  number: string,
): Promise<string | null> {
  const loggedOut = new Error();
  async function call(path: string, init?: RequestInit) {
    const response = await fetch(
      `https://api.traderepublic.com/api/v1/${path}`,
      { ...init, credentials: "include" },
    );
    if (response.status === 401) throw loggedOut;
    if (!response.ok)
      throw new Error(
        `${name} answered ${response.status.toString()} to ${path}.`,
      );
    return response;
  }

  // Only the web app's WebSocket names the depot numbers, in its accountPairs topic, and the session's cookies authenticate a socket the page opens.
  const listsDepot = () =>
    new Promise<boolean>((resolve, reject) => {
      const socket = new WebSocket("wss://api.traderepublic.com");
      const timeout = setTimeout(() => {
        socket.close();
        reject(new Error(`${name} did not name its depots in time.`));
      }, 10_000);
      socket.onopen = () => {
        socket.send('connect 35 {"locale":"de"}');
      };
      socket.onmessage = ({ data }: MessageEvent<string>) => {
        if (data === "connected") {
          socket.send('sub 1 {"type":"accountPairs"}');
          return;
        }
        clearTimeout(timeout);
        socket.close();
        const answer = /^1 A (.*)$/s.exec(data)?.[1];
        if (answer === undefined) {
          reject(new Error(`${name} refused to name its depots.`));
          return;
        }
        const { accounts } = JSON.parse(answer) as {
          accounts: { securitiesAccountNumber: string }[];
        };
        resolve(
          accounts.some(
            ({ securitiesAccountNumber }) => securitiesAccountNumber === number,
          ),
        );
      };
    });

  try {
    const exports = "portfolio-analytics/transactions/export";
    // Only the REST API answers a missing session with 401, so the export is requested before the account is looked up.
    let job = (await (
      await call(`${exports}/request`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        // The export rejects a period ending in the future, and starting before Trade Republic opened any account covers every account's history.
        body: JSON.stringify({
          from: "2000-01-01",
          to: new Date().toISOString().slice(0, 10),
        }),
      })
    ).json()) as { jobId: string; status: string };

    const listed =
      type === "depot"
        ? await listsDepot()
        : (
            (await (
              await call("account-manager/accounts/switchable")
            ).json()) as { accounts: { bankingInfo?: { iban?: string } }[] }
          ).accounts.some(({ bankingInfo }) => bankingInfo?.iban === number);
    if (!listed)
      throw new Error(
        `${name} lists no ${type === "depot" ? "depot" : "account"} with the number ${number}.`,
      );

    // The wait gives up before Firefox suspends the background, as entrypoints/background.ts of the extension explains.
    for (let polls = 0; job.status === "PENDING"; polls++) {
      if (polls === 20)
        throw new Error(`${name} did not finish the export in time.`);
      await new Promise((resolve) => setTimeout(resolve, 1_000));
      job = (await (
        await call(`${exports}/status?jobId=${job.jobId}`)
      ).json()) as typeof job;
    }
    if (job.status !== "COMPLETED")
      throw new Error(`${name}'s export ended with status ${job.status}.`);
    return await (await call(`${exports}/download?jobId=${job.jobId}`)).text();
  } catch (error) {
    if (error === loggedOut) return null;
    throw error;
  }
}

export default {
  ...bank,
  hosts: [`${webApp}*`],
  permissions: [],
  read: async ({ type, number }) => {
    const csv = await withSyncTab(async (tabId) => {
      await navigate(tabId, webApp);
      // The API authenticates the session's cookies and refuses requests without them, so the export calls it from the page's own world, as the web app does.
      return inject<string | null>(tabId, {
        world: "MAIN",
        func: exportCsv,
        args: [bank.name, type, number],
      });
    });
    if (csv === null) throw await notLoggedIn(webApp);
    return {
      shapeVersion: 1,
      rawTransactions: parseCsv(csv, type),
    };
  },
} satisfies BankAdapter;
