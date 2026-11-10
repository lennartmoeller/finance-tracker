import { expect, test } from "vitest";
import { parseTradeRepublicCsv } from "./trade-republic.ts";

const header =
  '"datetime","date","account_type","category","type","asset_class","name","symbol","shares","price","amount","fee","tax","currency","original_amount","original_currency","fx_rate","description","transaction_id","counterparty_name","counterparty_iban","payment_reference","mcc_code"';
const buy =
  '"2026-11-02T08:14:22.123Z","2026-11-02","DEFAULT","TRADING","BUY","FUND","All-World","IE00BK5BQT80","4.123456","121.25","-500.00","-1.00","","EUR","","","","Buy ""All-World"", savings plan","0b6f3c2e-8d1a-4c5e-9f2b-3a4d5e6f7a8b","","","",""';
const transfer =
  '"2026-11-01T10:31:00.000001Z","2026-11-01","DEFAULT","CASH","TRANSFER_INBOUND","","","","","","1000.000000","","","EUR","","","","Incoming transfer","1c7a4d3f-9e2b-4d6f-8a3c-4b5e6f7a8b9c","Max Mustermann","DE89370400440532013000","",""';
const csv = `${header}\n${buy}\n${transfer}\n`;

test("reads each row as an object keyed by the header, unquoting commas and quotes", () => {
  const [first, second] = parseTradeRepublicCsv(csv, "cash");
  expect(first).toMatchObject({
    type: "BUY",
    symbol: "IE00BK5BQT80",
    amount: "-500.00",
    description: 'Buy "All-World", savings plan',
    transaction_id: "0b6f3c2e-8d1a-4c5e-9f2b-3a4d5e6f7a8b",
  });
  expect(second).toMatchObject({
    counterparty_iban: "DE89370400440532013000",
    amount: "1000.000000",
  });
});

test("keeps only the rows with an ISIN for the depot", () => {
  expect(parseTradeRepublicCsv(csv, "depot")).toEqual([
    parseTradeRepublicCsv(csv, "cash")[0],
  ]);
});

test("rejects a changed header, an unquoted cell, a missing cell and a malformed amount", () => {
  for (const changed of [
    csv.replace('"mcc_code"', '"merchant_code"'),
    csv.replace('"Incoming transfer"', "Incoming transfer"),
    csv.replace(',""\n', "\n"),
    csv.replace('"-500.00"', '"-500,00"'),
  ]) {
    expect(() => parseTradeRepublicCsv(changed, "cash")).toThrow("format");
  }
});
