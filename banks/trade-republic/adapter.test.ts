import { expect, test } from "vitest";
import { parseCsv } from "./adapter.ts";

const header =
  '"datetime","date","account_type","category","type","asset_class","name","symbol","shares","price","amount","fee","tax","currency","original_amount","original_currency","fx_rate","description","transaction_id","counterparty_name","counterparty_iban","payment_reference","mcc_code"';
const buy =
  '"2026-11-02T08:14:22.123Z","2026-11-02","DEFAULT","TRADING","BUY","FUND","All-World","IE00BK5BQT80","4.123456","121.25","-500.00","-1.00","","EUR","","","","Buy ""All-World"", savings plan","0b6f3c2e-8d1a-4c5e-9f2b-3a4d5e6f7a8b","","","",""';
const transfer =
  '"2026-11-01T10:31:00.000001Z","2026-11-01","DEFAULT","CASH","TRANSFER_INBOUND","","","","","","1000.000000","","","EUR","","","","Incoming transfer","1c7a4d3f-9e2b-4d6f-8a3c-4b5e6f7a8b9c","Max Mustermann","DE89370400440532013000","",""';
const dividend =
  '"2026-10-15T06:00:00Z","2026-10-15","DEFAULT","TRADING","DIVIDEND","STOCK","Apple","US0378331005","9.077908","","4.31","","-0.86","EUR","5.02","USD","1.1650","Dividend\nQ4","2d8b5e4a-0f3c-4e7a-9b4d-5c6f7a8b9c0d","","","",""';
const csv = `${header}\n${buy}\n${transfer}\n${dividend}\n`;

const storedRawTransactions = [
  {
    datetime: "2026-11-02T08:14:22.123Z",
    date: "2026-11-02",
    account_type: "DEFAULT",
    category: "TRADING",
    type: "BUY",
    asset_class: "FUND",
    name: "All-World",
    symbol: "IE00BK5BQT80",
    shares: "4.123456",
    price: "121.25",
    amount: "-500.00",
    fee: "-1.00",
    tax: "",
    currency: "EUR",
    original_amount: "",
    original_currency: "",
    fx_rate: "",
    description: 'Buy "All-World", savings plan',
    transaction_id: "0b6f3c2e-8d1a-4c5e-9f2b-3a4d5e6f7a8b",
    counterparty_name: "",
    counterparty_iban: "",
    payment_reference: "",
    mcc_code: "",
  },
  {
    datetime: "2026-11-01T10:31:00.000001Z",
    date: "2026-11-01",
    account_type: "DEFAULT",
    category: "CASH",
    type: "TRANSFER_INBOUND",
    asset_class: "",
    name: "",
    symbol: "",
    shares: "",
    price: "",
    amount: "1000.000000",
    fee: "",
    tax: "",
    currency: "EUR",
    original_amount: "",
    original_currency: "",
    fx_rate: "",
    description: "Incoming transfer",
    transaction_id: "1c7a4d3f-9e2b-4d6f-8a3c-4b5e6f7a8b9c",
    counterparty_name: "Max Mustermann",
    counterparty_iban: "DE89370400440532013000",
    payment_reference: "",
    mcc_code: "",
  },
  {
    datetime: "2026-10-15T06:00:00Z",
    date: "2026-10-15",
    account_type: "DEFAULT",
    category: "TRADING",
    type: "DIVIDEND",
    asset_class: "STOCK",
    name: "Apple",
    symbol: "US0378331005",
    shares: "9.077908",
    price: "",
    amount: "4.31",
    fee: "",
    tax: "-0.86",
    currency: "EUR",
    original_amount: "5.02",
    original_currency: "USD",
    fx_rate: "1.1650",
    description: "Dividend\nQ4",
    transaction_id: "2d8b5e4a-0f3c-4e7a-9b4d-5c6f7a8b9c0d",
    counterparty_name: "",
    counterparty_iban: "",
    payment_reference: "",
    mcc_code: "",
  },
];

test("reads each row as the raw transaction stored so far, keys in the header's order, with or without a final line break", () => {
  for (const text of [csv, csv.slice(0, -1)]) {
    expect(JSON.stringify(parseCsv(text, "cash"))).toBe(
      JSON.stringify(storedRawTransactions),
    );
  }
});

test("keeps only the rows with an ISIN for the depot", () => {
  expect(parseCsv(csv, "depot")).toEqual([
    storedRawTransactions[0],
    storedRawTransactions[2],
  ]);
});

test("rejects a changed header, an unquoted cell, a missing or extra cell, a malformed amount and a trailing comma", () => {
  for (const changed of [
    csv.replace('"mcc_code"', '"merchant_code"'),
    csv.replace('"Incoming transfer"', "Incoming transfer"),
    csv.replace(',""\n', "\n"),
    csv.replace(',""\n', ',"",""\n'),
    csv.replace('"-500.00"', '"-500,00"'),
    `${csv},`,
  ]) {
    expect(() => parseCsv(changed, "cash")).toThrow("format");
  }
});
