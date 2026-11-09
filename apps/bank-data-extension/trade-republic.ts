import { z } from "zod";
import {
  tradeRepublicRawTransactionV1,
  type TradeRepublicRawTransactionV1,
} from "@finance-tracker/bank-data-api/trade-republic";
import { inject, navigate, notLoggedIn, withSyncTab } from "./sync-tab.ts";

export async function readTradeRepublicTransactions(iban: string) {
  const csv = await withSyncTab(async (tabId) => {
    await navigate(tabId, "https://app.traderepublic.com/");
    // The API authenticates the session's cookies and refuses requests without them, so the export calls it from the page's own world, as the web app does.
    return inject<string | null>(tabId, {
      world: "MAIN",
      func: exportTransactions,
      args: [iban],
    });
  });
  if (csv === null)
    throw await notLoggedIn("Trade Republic", "https://app.traderepublic.com");
  return {
    source: "Trade Republic",
    shapeVersion: 1,
    rawTransactions: parseTradeRepublicCsv(csv),
  } as const;
}

export function parseTradeRepublicCsv(
  text: string,
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
  if (JSON.stringify(header) !== JSON.stringify(columns) || !parsed.success) {
    throw new Error(
      "Trade Republic changed its export format, so nothing was sent; the adapter needs a new shape version.",
    );
  }
  return parsed.data;
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
async function exportTransactions(iban: string): Promise<string | null> {
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

  try {
    const { accounts } = (await (
      await call("account-manager/accounts/switchable")
    ).json()) as { accounts: { bankingInfo?: { iban?: string } }[] };
    if (!accounts.some((account) => account.bankingInfo?.iban === iban))
      throw new Error(`Trade Republic lists no account with the IBAN ${iban}.`);

    const exports = "portfolio-analytics/transactions/export";
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
