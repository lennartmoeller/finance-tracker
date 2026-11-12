import type { BankAdapter } from "@finance-tracker/shared/bank";
import type { Account } from "@finance-tracker/shared/contract";
import {
  parseRawTransactions,
  shapeMismatch,
} from "@finance-tracker/shared/raw-transactions";
import {
  inject,
  navigate,
  notLoggedIn,
  withSyncTab,
} from "@finance-tracker/shared/sync-tab";
import bank from "./bank.ts";
import { headerV1, depotV1 } from "./shapes.ts";

const hosts = ["https://portal.fnz.de/*"];

async function read({ number }: Pick<Account, "number">) {
  // The portal keeps the session's key in the path, and every visit to its login opens a new key, so the sync reuses the keys of the open portal tabs.
  const keys = new Set(
    (await browser.tabs.query({ url: hosts })).flatMap(
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
  return { shapeVersion: 1, rawTransactions: parseCsv(csv, number) };
}

export function parseCsv(text: string, number: string) {
  const [header, ...rows] = text.split("\r\n").filter(Boolean);
  if (header !== headerV1) throw shapeMismatch(bank.name);
  const rawTransactions = parseRawTransactions(
    bank.name,
    depotV1,
    rows.map((row) => row.split(";")),
  );
  if (rawTransactions.some(([depotNumber]) => depotNumber !== number))
    throw new Error(`${bank.name} exported another depot than the one synced.`);
  return rawTransactions;
}

async function exportTransactions(number: string): Promise<string> {
  async function call(path: string): Promise<Response> {
    const response = await fetch(`eox/rest/${path}`);
    if (!response.ok)
      throw new Error(
        `finvesto answered ${response.status.toString()} to ${path}.`,
      );
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
    .flatMap(({ investmentDepots }) => investmentDepots)
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

export default {
  ...bank,
  hosts,
  permissions: [],
  read,
} satisfies BankAdapter;
