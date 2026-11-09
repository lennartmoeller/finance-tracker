import { z } from "zod";
import {
  ingHeaderV1,
  ingRawTransactionV1,
  type IngRawTransactionV1,
} from "@finance-tracker/banks/ing";
import type { IngAccountRow } from "./entrypoints/ing-accounts.content.ts";

export async function readIngTransactions(
  iban: string,
): Promise<IngRawTransactionV1[]> {
  const { id: tabId } = await browser.tabs.create({
    url: "about:blank",
    active: false,
  });
  if (tabId === undefined) throw new Error("Firefox opened no tab.");
  browser.downloads.onCreated.addListener(eraseIngDownload);
  try {
    await navigate(tabId, "https://banking.ing.de/app/obligo");
    const rows = await inject<IngAccountRow[]>(
      tabId,
      "/content-scripts/ing-accounts.js",
    );
    const account = rows.find((row) => row.text.includes(iban));
    if (!account)
      throw new Error(`ING lists no account with the IBAN ${iban}.`);
    await navigate(tabId, account.url);
    const [csv] = await Promise.all([
      captureCsv(tabId),
      inject(tabId, "/content-scripts/ing-export.js"),
    ]);
    return parseIngCsv(new TextDecoder("windows-1252").decode(csv), iban);
  } finally {
    await browser.tabs.remove(tabId);
    browser.downloads.onCreated.removeListener(eraseIngDownload);
  }
}

export function parseIngCsv(text: string, iban: string): IngRawTransactionV1[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const exportIban = lines
    .find((line) => line.startsWith("IBAN;"))
    ?.split(";")[1]
    ?.replaceAll(" ", "");
  if (exportIban !== iban)
    throw new Error("ING exported another account than the one synced.");
  const header = lines.indexOf(ingHeaderV1);
  const rows = lines.slice(header + 1).map((line) => {
    const cells = line.split(";");
    // Verwendungszweck is free text that may contain semicolons, so a row is anchored on the four cells before it and the five after it.
    return [
      ...cells.slice(0, 4),
      cells.slice(4, -5).join(";"),
      ...cells.slice(-5),
    ];
  });
  const parsed = z.array(ingRawTransactionV1).safeParse(rows);
  if (header < 0 || !parsed.success) {
    throw new Error(
      "ING changed its export format, so nothing was sent; the adapter needs a new shape version.",
    );
  }
  return parsed.data;
}

async function navigate(tabId: number, url: string) {
  await new Promise<void>((resolve, reject) => {
    const settle = (error?: Error) => {
      browser.webNavigation.onCompleted.removeListener(onCompleted);
      clearTimeout(timeout);
      if (error) reject(error);
      else resolve();
    };
    const timeout = setTimeout(() => {
      settle(new Error("ING did not load in time."));
    }, 60_000);
    // tabs.onUpdated reports "complete" while the previous page is still shown, so only webNavigation tells when the new page loaded.
    function onCompleted(details: browser.webNavigation._OnCompletedDetails) {
      if (details.tabId !== tabId || details.frameId !== 0) return;
      if (details.url.startsWith("https://banking.ing.de/")) settle();
      else {
        settle(
          new Error(
            "Not logged in to ING. Log in at banking.ing.de and sync within five minutes.",
          ),
        );
      }
    }
    browser.webNavigation.onCompleted.addListener(onCompleted, {
      url: [{ hostEquals: "banking.ing.de" }, { hostEquals: "access.ing.de" }],
    });
    browser.tabs.update(tabId, { url }).catch(settle);
  });
  // In an inactive tab, a file injected before the page's first idle period never ran, so navigation ends only after one.
  await browser.scripting.executeScript({
    target: { tabId },
    func: () =>
      new Promise<void>((resolve) => {
        requestIdleCallback(() => {
          resolve();
        });
      }),
  });
}

async function inject<T>(tabId: number, file: string): Promise<T> {
  const [injection] = await browser.scripting.executeScript({
    target: { tabId },
    files: [file],
  });
  if (injection?.error !== undefined) throw new Error(String(injection.error));
  return injection?.result as T;
}

function captureCsv(tabId: number): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      browser.webRequest.onHeadersReceived.removeListener(onHeadersReceived);
      reject(new Error("ING sent no export in time."));
    }, 180_000);
    function onHeadersReceived(
      details: browser.webRequest._OnHeadersReceivedDetails,
    ) {
      const contentType = details.responseHeaders?.find(
        (header) => header.name.toLowerCase() === "content-type",
      );
      if (!contentType?.value?.startsWith("text/comma-separated-values"))
        return {};
      browser.webRequest.onHeadersReceived.removeListener(onHeadersReceived);
      clearTimeout(timeout);
      // Nothing is written back, so the page and the download it starts receive an empty file instead of the transactions.
      const filter = browser.webRequest.filterResponseData(details.requestId);
      const chunks: ArrayBuffer[] = [];
      filter.ondata = ({ data }) => chunks.push(data);
      filter.onstop = () => {
        filter.close();
        resolve(new Blob(chunks).arrayBuffer());
      };
      filter.onerror = () => {
        reject(new Error(filter.error));
      };
      return {};
    }
    browser.webRequest.onHeadersReceived.addListener(
      onHeadersReceived,
      { urls: ["https://banking.ing.de/*"], tabId },
      ["blocking", "responseHeaders"],
    );
  });
}

function eraseIngDownload(item: browser.downloads.DownloadItem) {
  if (!/^(blob:)?https:\/\/banking\.ing\.de\//.test(item.url)) return;
  // Cancelling fails once the empty file is complete, which then has to be removed instead.
  void browser.downloads
    .cancel(item.id)
    .catch(() => browser.downloads.removeFile(item.id))
    .then(() => browser.downloads.erase({ id: item.id }));
}
