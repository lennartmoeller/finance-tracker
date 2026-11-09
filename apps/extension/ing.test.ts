import { expect, test } from "vitest";
import { parseIngCsv } from "./ing.ts";

const iban = "DE89370400440532013000";
const csv = [
  "Umsatzanzeige;Datei erstellt am: 09.11.2026 19:00",
  "",
  "IBAN;DE89 3704 0044 0532 0130 00",
  "Zeitraum;09.10.2025 - 09.11.2026",
  "Saldo;1.096,50;EUR",
  "",
  "Buchung;Wertstellungsdatum;Auftraggeber/Empfänger;Buchungstext;Verwendungszweck;Referenz;Saldo;Währung;Betrag;Währung",
  "03.11.2026;03.11.2026;Café;Lastschrift;Kaffee; Kuchen;;1.096,50;EUR;-3,50;EUR",
  "01.11.2026;01.11.2026;Arbeitgeber;Gehalt;Lohn 10/2026;REF-4711;1.100,00;EUR;2.000,00;EUR",
].join("\r\n");

test("reads each row, keeping semicolons inside the Verwendungszweck", () => {
  expect(parseIngCsv(csv, iban)).toEqual([
    [
      "03.11.2026",
      "03.11.2026",
      "Café",
      "Lastschrift",
      "Kaffee; Kuchen",
      "",
      "1.096,50",
      "EUR",
      "-3,50",
      "EUR",
    ],
    [
      "01.11.2026",
      "01.11.2026",
      "Arbeitgeber",
      "Gehalt",
      "Lohn 10/2026",
      "REF-4711",
      "1.100,00",
      "EUR",
      "2.000,00",
      "EUR",
    ],
  ]);
});

test("rejects another account's export and a changed format", () => {
  expect(() => parseIngCsv(csv, "DE02120300000000202051")).toThrow(
    "another account",
  );
  expect(() => parseIngCsv(csv.replace("2.000,00", "2000.00"), iban)).toThrow(
    "format",
  );
});
