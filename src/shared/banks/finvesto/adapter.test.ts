import { expect, test } from "vitest";
import { parseCsv } from "./adapter.ts";
import { headerV1 } from "./shapes.ts";

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
const usdDistribution = buy
  .with(2, "0123456791/12345680")
  .with(4, "Fondsertrag (Ausschüttung)")
  .with(8, "3,6")
  .with(9, "USD")
  .with(10, "0")
  .with(30, "1,167463");
const rows = [buy, advanceTaxSale, usdDistribution];
const csv = `${[headerV1, ...rows.map((row) => row.join(";"))].join("\r\n")}\r\n`;

test("reads each row's cells", () => {
  expect(parseCsv(csv, depot)).toEqual(rows);
});

test("rejects another depot's export, a changed header, a malformed amount, an extra cell and a fund currency without its exchange rate", () => {
  expect(() => parseCsv(csv, "10987654321")).toThrow("another depot");
  for (const changed of [
    csv.replace("Ref. Nr.", "Referenz"),
    csv.replace(";40;EUR;", ";40.00;EUR;"),
    csv.replace(";0\r\n", ";0;\r\n"),
    csv.replace(";1,167463;", ";;"),
  ]) {
    expect(() => parseCsv(changed, depot)).toThrow("format");
  }
});
