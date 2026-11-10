import { expect, test } from "vitest";
import type { DeutscheBankGiroRawTransactionV1 } from "@finance-tracker/bank-data-api/deutsche-bank-giro";
import type { DeutscheBankDepotRawTransactionV1 } from "@finance-tracker/bank-data-api/deutsche-bank-depot";
import type { FinvestoRawTransactionV1 } from "@finance-tracker/bank-data-api/finvesto";
import type { TradeRepublicRawTransactionV1 } from "@finance-tracker/bank-data-api/trade-republic";
import { extractTransactions } from "./extraction.ts";

test("an ING booking keeps its German amount as a decimal and an empty counterparty as none", () => {
  expect(
    extractTransactions({ bank: "ING", type: "giro" }, [
      [
        "30.09.2026",
        "30.09.2026",
        "",
        "Abschluss",
        "Abschluss per 30.09.2026",
        "",
        "12.410,81",
        "EUR",
        "-1.234,50",
        "EUR",
      ],
    ]),
  ).toMatchObject([
    {
      date: "2026-09-30",
      amount: "-1234.50",
      currency: "EUR",
      counterparty: null,
      description: "Abschluss per 30.09.2026",
      isin: null,
      securityName: null,
      quantity: null,
    },
  ]);
});

const deutscheBankGiroBooking = Object.assign(
  Array<string>(18).fill("") as DeutscheBankGiroRawTransactionV1,
  {
    0: "3.5.2026",
    1: "3.5.2026",
    3: "Max Mustermann",
    4: "Umbuchung",
    11: "-100,8",
    17: "EUR",
  },
);

test("a Deutsche Bank booking pads its date and keeps an amount without trailing zeros", () => {
  expect(
    extractTransactions({ bank: "Deutsche Bank", type: "giro" }, [
      deutscheBankGiroBooking,
    ]),
  ).toMatchObject([
    {
      date: "2026-05-03",
      amount: "-100.8",
      counterparty: "Max Mustermann",
      description: "Umbuchung",
    },
  ]);
});

test("a Deutsche Bank depot rejects the giro account's raw transactions", () => {
  expect(
    extractTransactions({ bank: "Deutsche Bank", type: "depot" }, [
      deutscheBankGiroBooking,
    ]),
  ).toBeUndefined();
});

test("Deutsche Bank depot receipts add shares and dividends move none", () => {
  const transaction = (
    subType: DeutscheBankDepotRawTransactionV1["subType"],
    total: string,
  ): DeutscheBankDepotRawTransactionV1 => ({
    type: subType === "RECEIPT" ? "SECURITY" : "EARNING",
    subType,
    bookDate: "2025-09-25",
    valueDate: "2025-09-25",
    createDate: "2025-09-25",
    securitiesAccountId: "100000000001",
    security: { wkn: "000001", isin: "DE0000000001", name: "Muster AG" },
    quantity: "15.00",
    settlementCharges: {},
    calculatedAmounts: {
      totalAmountEuroCurrency: { amount: total, currency: "EUR" },
    },
  });
  expect(
    extractTransactions({ bank: "Deutsche Bank", type: "depot" }, [
      transaction("RECEIPT", "-1714.50"),
      transaction("DIVIDEND_DISBURSEMENT", "103.52"),
    ]),
  ).toMatchObject([
    {
      amount: "-1714.50",
      isin: "DE0000000001",
      securityName: "Muster AG",
      quantity: "15.00",
    },
    { amount: "103.52", quantity: null },
  ]);
});

test("Trade Republic trades move their signed shares, and dividends and cash rows move none", () => {
  const row = (
    type: string,
    shares: string,
    amount: string,
  ): TradeRepublicRawTransactionV1 => ({
    datetime: "2026-11-02T08:14:22.123Z",
    date: "2026-11-02",
    account_type: "DEFAULT",
    category: "TRADING",
    type,
    asset_class: "",
    name: shares ? "All-World" : "",
    symbol: shares ? "IE00BK5BQT80" : "",
    shares,
    price: "",
    amount,
    fee: "",
    tax: "",
    currency: "EUR",
    original_amount: "",
    original_currency: "",
    fx_rate: "",
    description: type,
    transaction_id: crypto.randomUUID(),
    counterparty_name: "",
    counterparty_iban: "",
    payment_reference: "",
    mcc_code: "",
  });
  expect(
    extractTransactions({ bank: "Trade Republic", type: "cash" }, [
      row("SELL", "-5.0000000000", "1006.10"),
      row("DIVIDEND", "9.0779080000", "4.31"),
      row("TRANSFER_INBOUND", "", "500.000000"),
    ]),
  ).toMatchObject([
    { amount: "1006.10", isin: "IE00BK5BQT80", quantity: "-5.0000000000" },
    { amount: "4.31", quantity: null },
    { amount: "500.000000", isin: null, quantity: null },
  ]);
});

test("finvesto signs its unsigned payment by Umsatzart and leaves out what moved nothing", () => {
  const row = (
    kind: FinvestoRawTransactionV1[4],
    payment: string,
    shares: string,
  ) => {
    const cells = Array<string>(33).fill("") as FinvestoRawTransactionV1;
    return Object.assign(cells, {
      2: "1/1",
      3: "28.10.26",
      4: kind,
      6: "Global Fund",
      7: "LU0000000001",
      8: payment,
      9: "EUR",
      10: shares,
    });
  };
  expect(
    extractTransactions({ bank: "finvesto", type: "depot" }, [
      row("Kauf", "40", "0,334823"),
      row("Fondsertrag (Ausschüttung)", "3,6", "0"),
      row("Entgeltbelastung Verkauf", "0", "-0,098047"),
    ]),
  ).toMatchObject([
    {
      date: "2026-10-28",
      amount: "-40",
      currency: "EUR",
      securityName: "Global Fund",
      quantity: "0.334823",
    },
    { amount: "3.6", quantity: null },
    { amount: null, currency: null, quantity: "-0.098047" },
  ]);
});
