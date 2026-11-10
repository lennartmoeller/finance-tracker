import { z } from "zod";
import type { Account } from "@finance-tracker/bank-data-api/contract";
import {
  finvestoHeaderV1,
  finvestoRawTransactionV1,
  type FinvestoRawTransactionV1,
} from "@finance-tracker/bank-data-api/finvesto";
import { shapeMismatch } from "./shape-mismatch.ts";
import { inject, navigate, notLoggedIn, withSyncTab } from "./sync-tab.ts";

export async function readFinvestoTransactions({
  number,
}: Pick<Account, "number">) {
  // The portal keeps the session's key in the path, and every visit to its login opens a new key, so the sync reuses the keys of the open portal tabs.
  const keys = new Set(
    (await browser.tabs.query({ url: "https://portal.fnz.de/*" })).flatMap(
      ({ url }) =>
        /^https:\/\/portal\.fnz\.de\/\(([^)]+)\)\//.exec(url ?? "")?.[1] ?? [],
    ),
  );
  const csv = await withSyncTab(async (tabId) => {
    for (const key of keys) {
      const loaded = await navigate(
        tabId,
        `https://portal.fnz.de/(${key})/finvesto/EOY/EL/`,
      );
      if (new URL(loaded).pathname.endsWith("/login")) continue;
      return inject<string>(tabId, {
        world: "MAIN",
        func: exportTransactions,
        args: [number],
      });
    }
    return null;
  });
  if (csv === null) throw await notLoggedIn("https://portal.fnz.de/finvesto");
  return {
    source: "finvesto",
    shapeVersion: 1,
    rawTransactions: parseFinvestoCsv(csv, number),
  } as const;
}

export function parseFinvestoCsv(
  text: string,
  number: string,
): FinvestoRawTransactionV1[] {
  const [header, ...rows] = text.split("\r\n").filter(Boolean);
  const parsed = z
    .array(finvestoRawTransactionV1)
    .safeParse(rows.map((row) => row.split(";")));
  if (header !== finvestoHeaderV1 || !parsed.success)
    throw shapeMismatch("finvesto");
  if (parsed.data.some(([depotNumber]) => depotNumber !== number))
    throw new Error("finvesto exported another depot than the one synced.");
  return parsed.data;
}

// executeScript serializes this function into the page, so it uses nothing from outside its body.
async function exportTransactions(number: string): Promise<string> {
  async function call(path: string): Promise<Response> {
    const response = await fetch(`eox/rest/${path}`);
    if (!response.ok) {
      throw new Error(
        `finvesto answered ${response.status.toString()} to ${path}.`,
      );
    }
    return response;
  }

  const { ownerGroups } = (await (
    await call("depot/getDepotOverviewDataForEndCustomer")
  ).json()) as {
    ownerGroups: {
      investmentDepots: {
        depotOrCashAccount: {
          depotOrCashAccountId: { depotId: { id: string } };
          externalDepotNumber: { externalDepotNumber: string };
        };
      }[];
    }[];
  };
  const depot = ownerGroups
    .flatMap((group) => group.investmentDepots)
    .find(
      ({ depotOrCashAccount }) =>
        depotOrCashAccount.externalDepotNumber.externalDepotNumber === number,
    );
  if (!depot)
    throw new Error(`finvesto lists no depot with the number ${number}.`);

  const filter = {
    depotId: depot.depotOrCashAccount.depotOrCashAccountId.depotId,
    showTransactionsOnDepotLevel: true,
    subDepotPos: null,
    // A start before any depot opened covers the whole history.
    dateFrom: "2000-01-01",
    dateTo: new Date().toISOString().slice(0, 10),
    pagination: null,
    showIngoingTransactions: true,
    showOutgoingTransactions: true,
    showTaxTransactions: true,
    showOtherTransactions: true,
    // Stored raw transactions never change, so a canceled transaction stays in the export beside its cancellation.
    includeCanceledTransactions: true,
    sortOrder: "BOOKING_DATE_DESC",
  };
  const csv = await call(
    `order-transaction/umsaetze-csv-end-customer/filter/${encodeURIComponent(btoa(encodeURIComponent(JSON.stringify(filter))))}`,
  );
  return new TextDecoder("windows-1252").decode(await csv.arrayBuffer());
}
