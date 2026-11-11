import { defineContentScript } from "wxt/utils/define-content-script";

export interface IngAccountRow {
  text: string;
  url: string;
}

export default defineContentScript({
  matches: ["https://banking.ing.de/*"],
  registration: "runtime",
  main: (): IngAccountRow[] =>
    [...document.querySelectorAll("div.g2p-account__row-wrap")].flatMap(
      (row) => {
        const link = row.querySelector<HTMLAnchorElement>(
          'a[href*="umsatzanzeige"]',
        );
        return link
          ? [{ text: row.textContent.replace(/\s/g, ""), url: link.href }]
          : [];
      },
    ),
});
