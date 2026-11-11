import { expect, test } from "vitest";
import { finvestoHeaderV1 } from "@finance-tracker/shared/finvesto";
import { parseFinvestoCsv } from "./finvesto.ts";

const depot = "12345678901";
const buy = [
  depot,
  "01",
  "0123456789/12345678",
  "03.11.26",
  "Kauf",
  "",
  "All-World",
  "IE00BK5BQT80",
  "40",
  "EUR",
  "0,312456",
  "128,02",
  "EUR",
  "31.10.26",
  "",
  "40",
  "0",
  "0",
  "0",
  "0",
  "0",
  "",
  "",
  "",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "",
  "Steuereinbehalt direkt am Umsatz",
  "0",
];
const advanceTaxSale = buy
  .with(2, "0123456790/12345679")
  .with(4, "Verkauf wegen Vorabpauschale")
  .with(8, "1,5")
  .with(10, "-0,011714")
  .with(28, "0,4");
const csv = `${finvestoHeaderV1}\r\n${buy.join(";")}\r\n${advanceTaxSale.join(";")}\r\n`;

test("reads each row's cells", () => {
  expect(parseFinvestoCsv(csv, depot)).toEqual([buy, advanceTaxSale]);
});

test("rejects another depot's export, a changed header, a malformed amount and an extra cell", () => {
  expect(() => parseFinvestoCsv(csv, "10987654321")).toThrow("another depot");
  for (const changed of [
    csv.replace("Ref. Nr.", "Referenz"),
    csv.replace(";40;EUR;", ";40.00;EUR;"),
    csv.replace(";0\r\n", ";0;\r\n"),
  ]) {
    expect(() => parseFinvestoCsv(changed, depot)).toThrow("format");
  }
});
