import { expect, test } from "vitest";
import type { DeutscheBankCashRawTransactionV1 } from "@finance-tracker/bank-data-api/deutsche-bank-cash";
import type { DeutscheBankDepotRawTransactionV1 } from "@finance-tracker/bank-data-api/deutsche-bank-depot";
import type { FinvestoRawTransactionV1 } from "@finance-tracker/bank-data-api/finvesto";
import type { TradeRepublicRawTransactionV1 } from "@finance-tracker/bank-data-api/trade-republic";
import { extractTransactions } from "./extraction.ts";

test("an ING booking keeps its German amount as a decimal and an empty counterparty as none", () => {
  expect(
    extractTransactions({ bank: "ING", type: "cash" }, [
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

const deutscheBankCashBooking = Object.assign(
  Array<string>(18).fill("") as DeutscheBankCashRawTransactionV1,
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
    extractTransactions({ bank: "Deutsche Bank", type: "cash" }, [
      deutscheBankCashBooking,
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

test("a Deutsche Bank depot rejects the cash account's raw transactions", () => {
  expect(
    extractTransactions({ bank: "Deutsche Bank", type: "depot" }, [
      deutscheBankCashBooking,
    ]),
  ).toBeUndefined();
});

test("a Deutsche Bank depot receipt adds its cost and shares, and a dividend adds neither", () => {
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
      amount: "1714.50",
      currency: "EUR",
      isin: "DE0000000001",
      securityName: "Muster AG",
      quantity: "15.00",
    },
    { amount: null, currency: null, quantity: null },
  ]);
});

test("Trade Republic cash amounts include fees and taxes, the depot takes a trade's opposite amount and no dividend, and trades move their signed shares", () => {
  const row = (
    type: string,
    shares: string,
    amount: string,
    fee = "",
    tax = "",
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
    fee,
    tax,
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
  const securityRows = [
    row("BUY", "2.0000000000", "-400.00", "-1.00"),
    row("SELL", "-5.0000000000", "1006.10", "-1.00"),
    row("DIVIDEND", "9.0779080000", "4.31", "", "-0.86"),
  ];
  expect(
    extractTransactions({ bank: "Trade Republic", type: "cash" }, [
      ...securityRows,
      row("TRANSFER_INBOUND", "", "500.000000"),
    ]),
  ).toMatchObject([
    { amount: "-401.00", isin: "IE00BK5BQT80", quantity: "2.0000000000" },
    { amount: "1005.10", quantity: "-5.0000000000" },
    { amount: "3.45", quantity: null },
    { amount: "500.000000", isin: null, quantity: null },
  ]);
  expect(
    extractTransactions(
      { bank: "Trade Republic", type: "depot" },
      securityRows,
    ),
  ).toMatchObject([
    { amount: "401.00", currency: "EUR" },
    { amount: "-1005.10" },
    { amount: null, currency: null },
  ]);
});

test("a finvesto purchase adds its payment, and income and charges paid by selling shares add nothing", () => {
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
      row("Verkauf wegen Vorabpauschale", "1,2", "-0,098047"),
    ]),
  ).toMatchObject([
    {
      date: "2026-10-28",
      amount: "40",
      currency: "EUR",
      securityName: "Global Fund",
      quantity: "0.334823",
    },
    { amount: null, currency: null, quantity: null },
    { amount: null, currency: null, quantity: "-0.098047" },
  ]);
});
