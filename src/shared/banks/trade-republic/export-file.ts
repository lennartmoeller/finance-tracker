import type { BankExportFile } from "../../bank.ts";
import type { Account } from "../../contract.ts";
import { parseRawTransactions, shapeMismatch } from "../../raw-transactions.ts";
import bank from "./bank.ts";
import { headerV1, rawTransactionV1 } from "./shapes.ts";

function quotedRows(text: string): string[][] | undefined {
  const cell = /"((?:[^"]|"")*)"(,|\n|$)/y;
  const rows: string[][] = [];
  let row: string[] = [];
  while (cell.lastIndex < text.length) {
    const [, quoted, separator] = cell.exec(text) ?? [];
    if (quoted === undefined) return undefined;
    row.push(quoted.replaceAll('""', '"'));
    if (separator === ",") continue;
    rows.push(row);
    row = [];
  }
  return row.length ? undefined : rows;
}

const read =
  (type: Account["type"]) => (file: ArrayBuffer | ArrayBufferView) => {
    const [header, ...rows] = quotedRows(new TextDecoder().decode(file)) ?? [];
    if (JSON.stringify(header) !== JSON.stringify(headerV1))
      throw shapeMismatch(bank.name);
    const parsed = parseRawTransactions(
      bank.name,
      rawTransactionV1,
      rows.map((cells) =>
        Object.fromEntries(
          cells.map((cell, index) => [headerV1[index] ?? index, cell]),
        ),
      ),
    );
    // The export holds the cash account's and the depot's rows alike, and the depot's rows are those with an ISIN: trades, dividends, stock perks and IPO subscriptions.
    return {
      shapeVersion: 1,
      rawTransactions:
        type === "depot"
          ? parsed.filter(({ symbol }) => symbol !== "")
          : parsed,
    };
  };

const download =
  "Export your transactions as CSV in Trade Republic's web app. The export holds the cash account and the depot, so upload it to both.";

export default {
  ...bank,
  exportFiles: {
    cash: { download, read: read("cash") },
    depot: { download, read: read("depot") },
  },
} satisfies BankExportFile;
