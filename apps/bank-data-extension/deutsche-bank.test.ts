import { expect, test } from "vitest";
import { parseDeutscheBankCsv } from "./deutsche-bank.ts";

const iban = "DE89370400440532013000";
const csv = [
  "Umsätze",
  "Konto;Filial-/Kontonummer;IBAN;Währung",
  `Girokonto;100 1234567 00;${iban};EUR`,
  "",
  "1.1.2026 - 9.11.2026",
  "Letzter Kontostand;;;;1.250,00;EUR",
  "Vorgemerkte und noch nicht gebuchte Umsätze sind nicht Bestandteil dieser Übersicht.",
  "Buchungstag;Wert;Umsatzart;Begünstigter / Auftraggeber;Verwendungszweck;IBAN / Kontonummer;BIC;Kundenreferenz;Mandatsreferenz;Gläubiger ID;Fremde Gebühren;Betrag;Abweichender Empfänger;Anzahl der Aufträge;Anzahl der Schecks;Soll;Haben;Währung",
  "3.11.2026;3.11.2026;SEPA-Lastschrift;Stadtwerke;Abschlag 11/2026;DE02120300000000202051;BYLADEM1001;12345678901234;M-4711;DE98ZZZ09999999999;;-100,8;;;;-100,8;;EUR",
  "1.11.2026;1.11.2026;SEPA-Überweisung von;Arbeitgeber;Lohn 10/2026;DE02120300000000202051;;NOTPROVIDED;;;;750;;;;;750;EUR",
  "Kontostand;9.11.2026;;;1.250,00;EUR",
  "",
].join("\n");

test("reads each row, dropping the preamble and the closing balance", () => {
  const rows = parseDeutscheBankCsv(csv, iban);
  expect(rows).toHaveLength(2);
  expect(rows[0]).toEqual([
    "3.11.2026",
    "3.11.2026",
    "SEPA-Lastschrift",
    "Stadtwerke",
    "Abschlag 11/2026",
    "DE02120300000000202051",
    "BYLADEM1001",
    "12345678901234",
    "M-4711",
    "DE98ZZZ09999999999",
    "",
    "-100,8",
    "",
    "",
    "",
    "-100,8",
    "",
    "EUR",
  ]);
});

test("rejects another account's export, a changed header, a malformed amount and an extra cell", () => {
  expect(() => parseDeutscheBankCsv(csv, "DE02120300000000202051")).toThrow(
    "another account",
  );
  for (const changed of [
    csv.replace("Gläubiger ID", "Glaeubiger-ID"),
    csv.replace("NOTPROVIDED;;;;750", "NOTPROVIDED;;;;750.00"),
    csv.replace(";EUR\nKontostand", ";EUR;\nKontostand"),
  ]) {
    expect(() => parseDeutscheBankCsv(changed, iban)).toThrow("format");
  }
});
