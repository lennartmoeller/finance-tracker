import { z } from "zod";
import type { Account } from "@finance-tracker/bank-data-api/contract";
import {
  tradeRepublicRawTransactionV1,
  type TradeRepublicRawTransactionV1,
} from "@finance-tracker/bank-data-api/trade-republic";
import { shapeMismatch } from "./shape-mismatch.ts";
import { inject, navigate, notLoggedIn, withSyncTab } from "./sync-tab.ts";

export async function readTradeRepublicTransactions({
  type,
  number,
}: Pick<Account, "type" | "number">) {
  const csv = await withSyncTab(async (tabId) => {
    await navigate(tabId, "https://app.traderepublic.com/");
    // The API authenticates the session's cookies and refuses requests without them, so the export calls it from the page's own world, as the web app does.
    return inject<string | null>(tabId, {
      world: "MAIN",
      func: exportTransactions,
      args: [type, number],
    });
  });
  if (csv === null) throw await notLoggedIn("https://app.traderepublic.com");
  return {
    shapeVersion: 1,
    rawTransactions: parseTradeRepublicCsv(csv, type),
  } as const;
}

export function parseTradeRepublicCsv(
  text: string,
  type: Account["type"],
): TradeRepublicRawTransactionV1[] {
  const columns = Object.keys(tradeRepublicRawTransactionV1.shape);
  const [header, ...rows] = quotedCells(text) ?? [];
  const parsed = z
    .array(tradeRepublicRawTransactionV1)
    .safeParse(
      rows.map((cells) =>
        Object.fromEntries(
          cells.map((cell, index) => [columns[index] ?? index, cell]),
        ),
      ),
    );
  if (JSON.stringify(header) !== JSON.stringify(columns) || !parsed.success)
    throw shapeMismatch("Trade Republic");
  // The export holds the cash account's and the depot's rows alike, and the depot's rows are those with an ISIN: trades, dividends and stock perks.
  return type === "depot"
    ? parsed.data.filter((row) => row.symbol !== "")
    : parsed.data;
}

function quotedCells(text: string): string[][] | undefined {
  const rows: string[][] = [];
  let row: string[] = [];
  const cell = /"((?:[^"]|"")*)"(,|\n|$)/y;
  while (cell.lastIndex < text.length) {
    const match = cell.exec(text);
    if (!match) return undefined;
    const [, quoted = "", separator] = match;
    row.push(quoted.replaceAll('""', '"'));
    if (separator !== ",") {
      rows.push(row);
      row = [];
    }
  }
  return row.length ? undefined : rows;
}

// executeScript serializes this function into the page, so it uses nothing from outside its body.
async function exportTransactions(
  type: Account["type"],
  number: string,
): Promise<string | null> {
  const missingSession = new Error();
  async function call(path: string, init?: RequestInit): Promise<Response> {
    const response = await fetch(
      `https://api.traderepublic.com/api/v1/${path}`,
      { ...init, credentials: "include" },
    );
    if (response.status === 401) throw missingSession;
    if (!response.ok) {
      throw new Error(
        `Trade Republic answered ${response.status.toString()} to ${path}.`,
      );
    }
    return response;
  }

  // Only the web app's WebSocket names the depot numbers, in its accountPairs topic, and the session's cookies authenticate a socket the page opens.
  function depotNumbers(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket("wss://api.traderepublic.com");
      const timeout = setTimeout(() => {
        socket.close();
        reject(new Error("Trade Republic did not name its depots in time."));
      }, 10_000);
      socket.onopen = () => {
        socket.send(`connect 35 ${JSON.stringify({ locale: "de" })}`);
      };
      socket.onmessage = ({ data }: MessageEvent<string>) => {
        if (data === "connected") {
          socket.send(`sub 1 ${JSON.stringify({ type: "accountPairs" })}`);
          return;
        }
        clearTimeout(timeout);
        socket.close();
        const answer = /^1 A (.*)$/s.exec(data)?.[1];
        if (answer === undefined) {
          reject(new Error("Trade Republic refused to name its depots."));
          return;
        }
        const { accounts } = JSON.parse(answer) as {
          accounts: { securitiesAccountNumber: string }[];
        };
        resolve(accounts.map((account) => account.securitiesAccountNumber));
      };
    });
  }

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
        ? (await depotNumbers()).includes(number)
        : (
            (await (
              await call("account-manager/accounts/switchable")
            ).json()) as { accounts: { bankingInfo?: { iban?: string } }[] }
          ).accounts.some((account) => account.bankingInfo?.iban === number);
    if (!listed)
      throw new Error(
        `Trade Republic lists no ${type === "depot" ? "depot" : "account"} with the number ${number}.`,
      );

    // Firefox suspends the extension's background after 30 seconds without events, so the wait gives up before then.
    for (let polls = 0; job.status === "PENDING"; polls++) {
      if (polls === 20)
        throw new Error("Trade Republic did not finish the export in time.");
      await new Promise((resolve) => setTimeout(resolve, 1_000));
      job = (await (
        await call(`${exports}/status?jobId=${job.jobId}`)
      ).json()) as typeof job;
    }
    if (job.status !== "COMPLETED")
      throw new Error(
        `Trade Republic's export ended with status ${job.status}.`,
      );
    return await (await call(`${exports}/download?jobId=${job.jobId}`)).text();
  } catch (error) {
    if (error === missingSession) return null;
    throw error;
  }
}
