import { z } from "zod";
import type { Account } from "@finance-tracker/shared/contract";
import {
  deutscheBankCashHeaderV1,
  deutscheBankCashRawTransactionV1,
  type DeutscheBankCashRawTransactionV1,
} from "@finance-tracker/shared/deutsche-bank-cash";
import {
  deutscheBankDepotRawTransactionV1,
  type DeutscheBankDepotRawTransactionV1,
} from "@finance-tracker/shared/deutsche-bank-depot";
import { shapeMismatch } from "./shape-mismatch.ts";
import { inject, navigate, notLoggedIn, withSyncTab } from "./sync-tab.ts";

interface AppRequest {
  url: string;
  headers: Record<string, string>;
}

export async function readDeutscheBankTransactions({
  type,
  number,
}: Pick<Account, "type" | "number">) {
  const texts = await withSyncTab(async (tabId) => {
    const overview = captureOverviewRequest(tabId);
    await navigate(tabId, "https://meine.deutsche-bank.de/");
    const request = await overview;
    if (!request) throw await notLoggedIn("https://meine.deutsche-bank.de");
    // The API authenticates a bearer token that the web app holds only in memory, so the export calls it from the page's own world with the token and API key of the app's own request.
    return inject<string[]>(tabId, {
      world: "MAIN",
      func: fetchTransactions,
      args: [request.url, request.headers, type, number],
    });
  });
  return {
    shapeVersion: 1,
    rawTransactions:
      type === "depot"
        ? texts.flatMap(parseDeutscheBankDepotJson)
        : texts.flatMap((csv) => parseDeutscheBankCashCsv(csv, number)),
  } as const;
}

export function parseDeutscheBankCashCsv(
  text: string,
  number: string,
): DeutscheBankCashRawTransactionV1[] {
  const lines = text.split("\n").filter(Boolean);
  if (lines[2]?.split(";")[2] !== number)
    throw new Error(
      "Deutsche Bank exported another account than the one synced.",
    );
  const header = lines.indexOf(deutscheBankCashHeaderV1);
  const parsed = z.array(deutscheBankCashRawTransactionV1).safeParse(
    lines
      .slice(header + 1)
      .filter((line) => !line.startsWith("Kontostand;"))
      .map((line) => line.split(";")),
  );
  if (header < 0 || !parsed.success) throw shapeMismatch("Deutsche Bank");
  return parsed.data;
}

export function parseDeutscheBankDepotJson(
  text: string,
): DeutscheBankDepotRawTransactionV1[] {
  const parsed = z
    .object({ transactions: z.array(deutscheBankDepotRawTransactionV1) })
    .safeParse(JSON.parse(text));
  if (!parsed.success) throw shapeMismatch("Deutsche Bank");
  return parsed.data.transactions;
}

function captureOverviewRequest(tabId: number): Promise<AppRequest | null> {
  return new Promise((resolve) => {
    const settle = (request: AppRequest | null) => {
      browser.webRequest.onBeforeSendHeaders.removeListener(
        onBeforeSendHeaders,
      );
      browser.tabs.onUpdated.removeListener(onUpdated);
      clearTimeout(timeout);
      resolve(request);
    };
    const timeout = setTimeout(() => {
      settle(null);
    }, 20_000);
    function onBeforeSendHeaders(
      details: browser.webRequest._OnBeforeSendHeadersDetails,
    ) {
      // The URL pattern also matches the overview's settings, and a CORS preflight carries no Authorization.
      if (
        details.method !== "GET" ||
        !/\/customers\/[^/]+\/financial-overview$/.test(details.url)
      )
        return;
      const header = (name: string) =>
        details.requestHeaders?.find(
          (requestHeader) => requestHeader.name.toLowerCase() === name,
        )?.value ?? "";
      // The browser's own headers, such as User-Agent, fail the API's CORS check, so only those that authenticate are taken.
      settle({
        url: details.url,
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
      if (url?.includes("#/login")) settle(null);
    }
    browser.webRequest.onBeforeSendHeaders.addListener(
      onBeforeSendHeaders,
      {
        urls: [
          "https://api.olb.deutsche-bank.de/customers/*/financial-overview",
        ],
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

// executeScript serializes this function into the page, so it uses nothing from outside its body.
async function fetchTransactions(
  overviewUrl: string,
  headers: Record<string, string>,
  type: Account["type"],
  number: string,
): Promise<string[]> {
  async function call(url: string, body?: object): Promise<Response> {
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
    if (!response.ok) {
      throw new Error(
        `Deutsche Bank answered ${response.status.toString()} to ${new URL(url).pathname}.`,
      );
    }
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
    const transactions = `https://api.olb.deutsche-bank.de/investments/securities-accounts/${encodeURIComponent(depot.id)}/transactions?start_date=2000-01-01`;
    return [await (await call(transactions)).text()];
  }

  const account = products.find((product) => product.details?.iban === number);
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
    const job = `${exports}/${encodeURIComponent(id)}`;
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
    csvs.push(await (await call(job)).text());
  }
  return csvs;
}
