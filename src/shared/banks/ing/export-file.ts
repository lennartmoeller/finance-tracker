import type { BankExportFile } from "../../bank.ts";
import {
  anotherAccount,
  parseRawTransactions,
  shapeMismatch,
} from "../../raw-transactions.ts";
import bank from "./bank.ts";
import { cashV1, headerV1 } from "./shapes.ts";

function read(file: ArrayBuffer | ArrayBufferView, iban: string) {
  const lines = new TextDecoder("windows-1252")
    .decode(file)
    .split(/\r?\n/)
    .filter(Boolean);
  const header = lines.indexOf(headerV1);
  if (header < 0) throw shapeMismatch(bank.name);
  const exportIban = lines
    .find((line) => line.startsWith("IBAN;"))
    ?.split(";")[1]
    ?.replaceAll(" ", "");
  if (exportIban !== iban) throw anotherAccount(bank.name);
  const rawTransactions = parseRawTransactions(
    bank.name,
    cashV1,
    lines.slice(header + 1).map((line) => {
      const cells = line.split(";");
      // Verwendungszweck is free text that may contain semicolons, so a row is anchored on the four cells before it and the five after it.
      return [
        ...cells.slice(0, 4),
        cells.slice(4, -5).join(";"),
        ...cells.slice(-5),
      ];
    }),
  );
  return { shapeVersion: 1, rawTransactions };
}

export default {
  ...bank,
  exportFiles: {
    cash: {
      download:
        "In ING's online banking, open the account's transactions, filter the period you need and export them as CSV.",
      read,
    },
  },
} satisfies BankExportFile;
