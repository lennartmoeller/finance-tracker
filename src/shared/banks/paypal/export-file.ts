import type { BankExportFile } from "../../bank.ts";
import { quotedRows } from "../../quoted-rows.ts";
import {
  anotherAccount,
  parseRawTransactions,
  shapeMismatch,
} from "../../raw-transactions.ts";
import bank from "./bank.ts";
import { cashV1, headerV1 } from "./shapes.ts";

type Row = Record<keyof typeof cashV1.shape, string>;

// Each group left out adds up to zero over time, so the imported rows still add up to PayPal's balance:
// authorisations and other Memo rows change no balance, a foreign-currency payment is settled by the EUR side of its conversion,
// a purchase paid later is spending once while the buyer credit's draw and repayments only move debt,
// and a hold and a buyer-protection payout's pair undo each other.
const imported = (row: Row) =>
  ["Haben", "Soll"].includes(row["Auswirkung auf Guthaben"]) &&
  row["Währung"] === "EUR" &&
  !row.Typ.includes("Käuferkredit") &&
  !(
    row.Typ === "Allgemeine Zahlung" &&
    row.Name === "PayPal (Europe) S.à r.l. et Cie, SCA"
  ) &&
  ![
    "Einbehaltung für offene Autorisierung",
    "Rückbuchung allgemeiner Einbehaltung",
  ].includes(row.Typ);

// A bank funding or withdrawal that bounces, as when a purchase is refunded within minutes, never moved money:
// its reversal carries a withdrawal's own transaction code, or names a bank funding as its related transaction.
const reversed = (rows: Row[]) =>
  new Set(
    rows.flatMap((row) =>
      row.Typ === "Rückbuchung von ACH-Abbuchung"
        ? [row.Transaktionscode]
        : row.Typ === "Rückbuchung von ACH-Gutschrift"
          ? [row.Transaktionscode, row["Zugehöriger Transaktionscode"]]
          : [],
    ),
  );

function read(file: ArrayBuffer | ArrayBufferView, email: string) {
  const [header, ...cells] = quotedRows(new TextDecoder().decode(file)) ?? [];
  if (
    JSON.stringify(header) !== JSON.stringify(headerV1) ||
    cells.some((row) => row.length !== headerV1.length)
  )
    throw shapeMismatch(bank.name);
  const rows = cells.map(
    (row) =>
      Object.fromEntries(
        row.map((cell, index) => [headerV1[index], cell]),
      ) as Row,
  );
  const own = email.toLowerCase();
  if (
    !rows.every((row) =>
      [row["Absender E-Mail-Adresse"], row["Empfänger E-Mail-Adresse"]].some(
        (address) => address.toLowerCase() === own,
      ),
    )
  )
    throw anotherAccount(bank.name);
  const undone = reversed(rows);
  return {
    shapeVersion: 1,
    rawTransactions: parseRawTransactions(
      bank.name,
      cashV1,
      rows.filter((row) => imported(row) && !undone.has(row.Transaktionscode)),
    ),
  };
}

export default {
  ...bank,
  exportFiles: {
    cash: {
      download:
        "On PayPal's website, open Aktivitäten → Herunterladen, choose Benutzerdefiniert, the transaction type Guthaben-relevant and CSV, for up to 12 months per report.",
      read,
    },
  },
} satisfies BankExportFile;
