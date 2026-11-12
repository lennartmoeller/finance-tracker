import { z } from "zod";
import type { BankAdapter } from "@finance-tracker/shared/bank";
import type { Account } from "@finance-tracker/shared/contract";
import { parseRawTransactions, shapeMismatch } from "../raw-transactions.ts";
import { inject, navigate, notLoggedIn, withSyncTab } from "../sync-tab.ts";
import bank from "./bank.ts";
import { cashHeaderV1, cashV1, depotV1 } from "./shapes.ts";

const webApp = "https://meine.deutsche-bank.de";
const api = "https://api.olb.deutsche-bank.de";

type AppRequest = { url: string; headers: Record<string, string> };

export function parseCashCsv(text: string, number: string) {
  const lines = text.split("\n").filter(Boolean);
  if (lines[2]?.split(";")[2] !== number)
    throw new Error(
      "Deutsche Bank exported another account than the one synced.",
    );
  const header = lines.indexOf(cashHeaderV1);
  if (header < 0) throw shapeMismatch(bank.name);
  return parseRawTransactions(
    bank.name,
    cashV1,
    lines
      .slice(header + 1)
      .filter((line) => !line.startsWith("Kontostand;"))
      .map((line) => line.split(";")),
  );
}

export const parseDepotJson = (text: string) =>
  parseRawTransactions(bank.name, z.object({ transactions: depotV1.array() }), [
    JSON.parse(text),
  ]).flatMap(({ transactions }) => transactions);

async function read({ type, number }: Pick<Account, "type" | "number">) {
  const texts = await withSyncTab(async (tabId) => {
    const overview = captureOverviewRequest(tabId);
    await navigate(tabId, `${webApp}/`);
    const request = await overview;
    if (!request) throw await notLoggedIn(webApp);
    // The API authenticates a bearer token that the web app holds only in memory, so the requests run in the page's own world.
    return inject<string[]>(tabId, {
      world: "MAIN",
      func: fetchTexts,
      args: [request.url, request.headers, type, number],
    });
  });
  return {
    shapeVersion: 1,
    rawTransactions:
      type === "depot"
        ? texts.flatMap(parseDepotJson)
        : texts.flatMap((csv) => parseCashCsv(csv, number)),
  };
}

function captureOverviewRequest(tabId: number) {
  return new Promise<AppRequest | undefined>((resolve) => {
    const timeout = setTimeout(() => {
      settle();
    }, 20_000);
    function onBeforeSendHeaders({
      method,
      url,
      requestHeaders,
    }: browser.webRequest._OnBeforeSendHeadersDetails) {
      // The URL pattern also matches the overview's settings, and a CORS preflight carries no Authorization.
      if (
        method !== "GET" ||
        !/\/customers\/[^/]+\/financial-overview$/.test(url)
      )
        return;
      const header = (name: string) =>
        requestHeaders?.find((sent) => sent.name.toLowerCase() === name)
          ?.value ?? "";
      // The browser's own headers, such as User-Agent, fail the API's CORS check, so only those that authenticate are taken.
      settle({
        url,
        headers: {
          authorization: header("authorization"),
          apikey: header("apikey"),
          // The export's language follows Accept-Language, and shape version 1 is the German export.
          "accept-language": "de",
        },
      });
    }
    function onUpdated(
      _tabId: number,
      { url }: browser.tabs._OnUpdatedChangeInfo,
    ) {
      if (url?.includes("#/login")) settle();
    }
    function settle(request?: AppRequest) {
      browser.webRequest.onBeforeSendHeaders.removeListener(
        onBeforeSendHeaders,
      );
      browser.tabs.onUpdated.removeListener(onUpdated);
      clearTimeout(timeout);
      resolve(request);
    }
    browser.webRequest.onBeforeSendHeaders.addListener(
      onBeforeSendHeaders,
      {
        urls: [`${api}/customers/*/financial-overview`],
        tabId,
      },
      ["requestHeaders"],
    );
    browser.tabs.onUpdated.addListener(onUpdated, {
      tabId,
      properties: ["url"],
    });
  });
}

async function fetchTexts(
  overviewUrl: string,
  headers: Record<string, string>,
  type: Account["type"],
  number: string,
): Promise<string[]> {
  async function call(url: string, body?: object) {
    const response = await fetch(
      url,
      body
        ? {
            method: "POST",
            headers: { ...headers, "content-type": "application/json" },
            body: JSON.stringify(body),
          }
        : { headers },
    );
    if (!response.ok)
      throw new Error(
        `Deutsche Bank answered ${response.status.toString()} to ${new URL(url).pathname}.`,
      );
    return response;
  }

  const { groups } = (await (await call(overviewUrl)).json()) as {
    groups: {
      products: {
        id: string;
        category: string;
        details?: {
          iban?: string;
          branchNumber?: string;
          accountNumber?: string;
          subAccountNumber?: string;
          openingDate?: string;
        };
      }[];
    }[];
  };
  const products = groups.flatMap((group) => group.products);

  if (type === "depot") {
    const depot = products.find(
      ({ category, details }) =>
        category === "SECURITIES_ACCOUNT" &&
        [
          details?.branchNumber,
          details?.accountNumber,
          details?.subAccountNumber,
        ].join("") === number,
    );
    if (!depot)
      throw new Error(
        `Deutsche Bank lists no depot with the number ${number}.`,
      );
    // The web app asks for the last 90 days, and a start before any depot opened returns the whole history at once.
    return [
      await (
        await call(
          `https://api.olb.deutsche-bank.de/investments/securities-accounts/${encodeURIComponent(depot.id)}/transactions?start_date=2000-01-01`,
        )
      ).text(),
    ];
  }

  const account = products.find(({ details }) => details?.iban === number);
  if (!account?.details?.openingDate)
    throw new Error(
      `Deutsche Bank lists no account with the number ${number}.`,
    );
  const exports = `https://api.olb.deutsche-bank.de/products/${encodeURIComponent(account.id)}/exports/transactions`;
  const today = new Date().toISOString().slice(0, 10);
  const thisYear = Number(today.slice(0, 4));
  const csvs: string[] = [];
  // The export rejects periods over 13 months and runs one at a time, so the history is read year by year since the account opened.
  for (
    let year = Number(account.details.openingDate.slice(0, 4));
    year <= thisYear;
    year++
  ) {
    const { id } = (await (
      await call(exports, {
        startDate: `${year.toString()}-01-01`,
        endDate: year < thisYear ? `${year.toString()}-12-31` : today,
        type: "csv",
      })
    ).json()) as { id: string };
    for (let polls = 0; ; polls++) {
      const { status } = (await (
        await call(`${exports}/status/${encodeURIComponent(id)}`)
      ).json()) as { status: string };
      if (status === "FINISHED") break;
      if (status === "ERROR")
        throw new Error("Deutsche Bank could not create the export.");
      if (polls === 20)
        throw new Error("Deutsche Bank did not finish the export in time.");
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
    csvs.push(
      await (await call(`${exports}/${encodeURIComponent(id)}`)).text(),
    );
  }
  return csvs;
}

export default {
  ...bank,
  hosts: [`${webApp}/*`, `${api}/*`],
  permissions: ["webRequest"],
  read,
} satisfies BankAdapter;
