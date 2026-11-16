import type { BankExportFile } from "../../bank.ts";
import {
  anotherAccount,
  parseRawTransactions,
  shapeMismatch,
} from "../../raw-transactions.ts";
import bank from "./bank.ts";
import { depotV1, headerV1 } from "./shapes.ts";

function read(file: ArrayBuffer | ArrayBufferView, number: string) {
  const [header, ...rows] = new TextDecoder("windows-1252")
    .decode(file)
    .split("\r\n")
    .filter(Boolean);
  if (header !== headerV1) throw shapeMismatch(bank.name);
  const rawTransactions = parseRawTransactions(
    bank.name,
    depotV1,
    rows.map((row) => row.split(";")),
  );
  if (rawTransactions.some(([depotNumber]) => depotNumber !== number))
    throw anotherAccount(bank.name);
  return { shapeVersion: 1, rawTransactions };
}

export default {
  ...bank,
  exportFiles: {
    depot: {
      download:
        "Export the depot's transactions as CSV in the FNZ portal, from the depot's opening to today.",
      read,
    },
  },
} satisfies BankExportFile;
