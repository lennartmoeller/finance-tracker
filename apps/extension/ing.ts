import { z } from "zod";
import {
  ingHeaderV1,
  ingRawTransactionV1,
  type IngRawTransactionV1,
} from "@finance-tracker/banks/ing";
import type { IngAccountRow } from "./entrypoints/ing-accounts.content.ts";
import { inject, navigate, withSyncTab } from "./sync-tab.ts";

export async function readIngTransactions(iban: string) {
  browser.downloads.onCreated.addListener(eraseIngDownload);
  try {
    const rawTransactions = await withSyncTab(async (tabId) => {
      await openIng(tabId, "https://banking.ing.de/app/obligo");
      const rows = await inject<IngAccountRow[]>(tabId, {
        files: ["/content-scripts/ing-accounts.js"],
      });
      const account = rows.find((row) => row.text.includes(iban));
      if (!account)
        throw new Error(`ING lists no account with the IBAN ${iban}.`);
      await openIng(tabId, account.url);
      const [csv] = await Promise.all([
        captureCsv(tabId),
        inject(tabId, { files: ["/content-scripts/ing-export.js"] }),
      ]);
      return parseIngCsv(new TextDecoder("windows-1252").decode(csv), iban);
    });
    return { source: "ING", shapeVersion: 1, rawTransactions } as const;
  } finally {
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

async function openIng(tabId: number, url: string) {
  if (!(await navigate(tabId, url)).startsWith("https://banking.ing.de/")) {
    throw new Error(
      "Not logged in to ING. Log in at banking.ing.de and sync within five minutes.",
    );
  }
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
