import type { BankExportFile } from "../../bank.ts";
import {
  anotherAccount,
  parseRawTransactions,
  shapeMismatch,
} from "../../raw-transactions.ts";
import bank from "./bank.ts";
import { cashHeaderV1, cashV1 } from "./shapes.ts";

function read(file: ArrayBuffer | ArrayBufferView, iban: string) {
  const lines = new TextDecoder().decode(file).split("\n").filter(Boolean);
  const header = lines.indexOf(cashHeaderV1);
  if (header < 0) throw shapeMismatch(bank.name);
  if (lines[2]?.split(";")[2] !== iban) throw anotherAccount(bank.name);
  const rawTransactions = parseRawTransactions(
    bank.name,
    cashV1,
    lines
      .slice(header + 1)
      .filter((line) => !line.startsWith("Kontostand;"))
      .map((line) => line.split(";")),
  );
  return { shapeVersion: 1, rawTransactions };
}

export default {
  ...bank,
  exportFiles: {
    cash: {
      download:
        "Export the account's transactions as CSV in Deutsche Bank's online banking, with German as its language. An export spans at most 13 months, so a longer history takes one upload per export.",
      read,
    },
  },
} satisfies BankExportFile;
