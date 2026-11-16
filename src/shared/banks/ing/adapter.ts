import type { BankAdapter } from "../../bank.ts";
import { inject, navigate, notLoggedIn, withSyncTab } from "../../sync-tab.ts";
import bank from "./bank.ts";
import exportFile from "./export-file.ts";

const origin = "https://banking.ing.de";
const hosts = [`${origin}/*`];

async function read({ number }: { number: string }) {
  browser.downloads.onCreated.addListener(eraseExportDownload);
  try {
    return await withSyncTab(async (tabId) => {
      await open(tabId, `${origin}/app/obligo`);
      const url = await inject<string | undefined>(tabId, {
        func: transactionListUrl,
        args: [number],
      });
      if (!url)
        throw new Error(`ING lists no account with the number ${number}.`);
      await open(tabId, url);
      const [csv] = await Promise.all([
        captureCsv(tabId),
        inject(tabId, { func: startCsvExport }),
      ]);
      return exportFile.exportFiles.cash.read(csv, number);
    });
  } finally {
    browser.downloads.onCreated.removeListener(eraseExportDownload);
  }
}

async function open(tabId: number, url: string) {
  if (!(await navigate(tabId, url)).startsWith(`${origin}/`))
    throw await notLoggedIn(origin);
}

function transactionListUrl(iban: string) {
  for (const row of document.querySelectorAll("div.g2p-account__row-wrap")) {
    const link = row.querySelector<HTMLAnchorElement>(
      'a[href*="umsatzanzeige"]',
    );
    if (link && row.textContent.replace(/\s/g, "").includes(iban))
      return link.href;
  }
}

async function startCsvExport() {
  const visible = (
    element: Element | null | undefined,
  ): element is HTMLElement => {
    if (!(element instanceof HTMLElement)) return false;
    const style = getComputedStyle(element);
    return (
      style.display !== "none" &&
      style.visibility === "visible" &&
      element.offsetHeight > 0
    );
  };
  const busy = () =>
    [...document.querySelectorAll('[class*="busy-indicator"]')].some(visible);
  const dateInput = (name: "von" | "bis") =>
    document.querySelector<HTMLInputElement>(
      `input[name="filterAnzeige:datum:${name}:input"]`,
    );
  const findButton = (label: RegExp) =>
    [
      ...document.querySelectorAll<HTMLElement>(
        "a, button, input[type=submit]",
      ),
    ].find(
      (element) =>
        label.test(
          (element instanceof HTMLInputElement
            ? element.value
            : element.textContent
          ).trim(),
        ) && visible(element),
    );
  const click = (label: RegExp) => {
    const button = findButton(label);
    if (!button) throw new Error(`ING shows no button ${label.source}.`);
    button.click();
  };
  const setDate = (name: "von" | "bis", value: string) => {
    const input = dateInput(name);
    if (!input) throw new Error("ING shows no date filter.");
    input.focus();
    input.value = value;
    for (const type of ["input", "change", "blur"])
      input.dispatchEvent(new Event(type, { bubbles: true }));
  };
  const germanDateYearsAgo = (years: number) => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - years);
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
  const waitFor = async (condition: () => unknown, timeout: number) => {
    for (const deadline = Date.now() + timeout; Date.now() < deadline;) {
      if (condition()) return true;
      void globalThis.browser.runtime.sendMessage("keepalive");
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    return false;
  };
  const step = async (what: string, condition: () => unknown) => {
    if (!(await waitFor(condition, 60_000)))
      throw new Error(`ING did not ${what} in time.`);
  };

  if (!visible(dateInput("von"))) {
    click(/^Filter$/);
    await step("open the filter", () => visible(dateInput("von")));
  }
  // ING clamps a range beyond the 390 days it keeps online, writes the clamped start back into the field, and closes the filter once the list is updated.
  const from = germanDateYearsAgo(15);
  setDate("von", from);
  setDate("bis", germanDateYearsAgo(0));
  click(/^Filter anwenden$/);
  await step(
    "apply the filter",
    () =>
      dateInput("von")?.value !== from && !visible(dateInput("von")) && !busy(),
  );

  click(/^Exportieren$/);
  await step("open the export dialog", () => findButton(/^Jetzt exportieren$/));
  const csv = [
    ...document.querySelectorAll<HTMLInputElement>(
      'input[type=radio][name*="exportTypes"]',
    ),
  ].find((radio) =>
    (radio.closest("label") ?? radio.parentElement)?.textContent.includes(
      "CSV",
    ),
  );
  if (!csv) throw new Error("ING's export dialog offers no CSV.");
  // Choosing the format is a round trip of its own; confirming before it ends exports nothing.
  csv.click();
  await waitFor(busy, 2_000);
  await step("select CSV", () => !busy());
  click(/^Jetzt exportieren$/);
}

function captureCsv(tabId: number) {
  return new Promise<ArrayBuffer>((resolve, reject) => {
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
        return;
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
    }
    browser.webRequest.onHeadersReceived.addListener(
      onHeadersReceived,
      { urls: hosts, tabId },
      ["blocking", "responseHeaders"],
    );
  });
}

function eraseExportDownload(item: browser.downloads.DownloadItem) {
  if (!item.url.replace(/^blob:/, "").startsWith(`${origin}/`)) return;
  // Cancelling fails once the empty file is complete, which then has to be removed instead.
  void browser.downloads
    .cancel(item.id)
    .catch(() => browser.downloads.removeFile(item.id))
    .then(() => browser.downloads.erase({ id: item.id }));
}

export default {
  ...bank,
  hosts,
  permissions: [
    "downloads",
    "webRequest",
    "webRequestBlocking",
    "webRequestFilterResponse",
  ],
  read,
} satisfies BankAdapter;
