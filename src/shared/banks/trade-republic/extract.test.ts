import { expect, test } from "vitest";
import tradeRepublic from "./extract.ts";

const row = (
  transaction_id: string,
  type: string,
  shares: string,
  amount: string,
  fee = "",
  tax = "",
) => ({
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
  transaction_id,
  counterparty_name: "",
  counterparty_iban: "",
  payment_reference: "",
  mcc_code: "",
});

const securityRows = [
  row(
    "0b6f3c2e-8d1a-4c5e-9f2b-3a4d5e6f7a8b",
    "BUY",
    "2.0000000000",
    "-400.00",
    "-1.00",
  ),
  row(
    "1c7a4d3f-9e2b-4d6f-8a3c-4b5e6f7a8b9c",
    "SELL",
    "-5.0000000000",
    "1006.10",
    "-1.00",
  ),
  row(
    "2d8b5e4a-0f3c-4e7a-9b4d-5c6f7a8b9c0d",
    "DIVIDEND",
    "9.0779080000",
    "4.31",
    "",
    "-0.86",
  ),
];

test("a cash amount includes fees and taxes and falls on its Berlin day, under the transaction ID, and reads the other account's IBAN from the description where its field is empty", () => {
  const inpayment = {
    ...row(
      "3e9c6f5b-1a4d-4f8b-8c5e-6d7a8b9c0d1e",
      "CUSTOMER_INPAYMENT",
      "",
      "500.000000",
    ),
    datetime: "2026-04-01T22:51:44.341400Z",
    date: "2026-04-01",
    description: "Direct Debit Top up with DE89 3704 0044 0532 0130 00",
    counterparty_name: "Max Mustermann",
  };
  expect(
    tradeRepublic.extractions.cash[1]([...securityRows, inpayment])?.map(
      ({ identity, cash }) => ({ identity, cash }),
    ),
  ).toEqual([
    {
      identity: "0b6f3c2e-8d1a-4c5e-9f2b-3a4d5e6f7a8b",
      cash: {
        date: "2026-11-02",
        amount: "-401.00",
        currency: "EUR",
        counterparty: null,
        counterpartyIban: null,
        description: "BUY",
      },
    },
    {
      identity: "1c7a4d3f-9e2b-4d6f-8a3c-4b5e6f7a8b9c",
      cash: {
        date: "2026-11-02",
        amount: "1005.10",
        currency: "EUR",
        counterparty: null,
        counterpartyIban: null,
        description: "SELL",
      },
    },
    {
      identity: "2d8b5e4a-0f3c-4e7a-9b4d-5c6f7a8b9c0d",
      cash: {
        date: "2026-11-02",
        amount: "3.45",
        currency: "EUR",
        counterparty: null,
        counterpartyIban: null,
        description: "DIVIDEND",
      },
    },
    {
      identity: "3e9c6f5b-1a4d-4f8b-8c5e-6d7a8b9c0d1e",
      cash: {
        date: "2026-04-02",
        amount: "500.00",
        currency: "EUR",
        counterparty: "Max Mustermann",
        counterpartyIban: "DE89370400440532013000",
        description: "Direct Debit Top up with DE89 3704 0044 0532 0130 00",
      },
    },
  ]);
});

test("a depot trade takes the opposite amount with its signed shares, and a dividend is a distribution", () => {
  expect(
    tradeRepublic.extractions.depot[1](securityRows)?.map(
      ({ identity, depot }) => ({ identity, depot }),
    ),
  ).toEqual([
    {
      identity: "0b6f3c2e-8d1a-4c5e-9f2b-3a4d5e6f7a8b",
      depot: {
        date: "2026-11-02",
        isin: "IE00BK5BQT80",
        securityName: "All-World",
        type: "trade",
        quantity: "2.0000000000",
        amount: "401.00",
        currency: "EUR",
        description: "BUY",
      },
    },
    {
      identity: "1c7a4d3f-9e2b-4d6f-8a3c-4b5e6f7a8b9c",
      depot: {
        date: "2026-11-02",
        isin: "IE00BK5BQT80",
        securityName: "All-World",
        type: "trade",
        quantity: "-5.0000000000",
        amount: "-1005.10",
        currency: "EUR",
        description: "SELL",
      },
    },
    {
      identity: "2d8b5e4a-0f3c-4e7a-9b4d-5c6f7a8b9c0d",
      depot: {
        date: "2026-11-02",
        isin: "IE00BK5BQT80",
        securityName: "All-World",
        type: "distribution",
        quantity: null,
        amount: "3.45",
        currency: "EUR",
        description: "DIVIDEND",
      },
    },
  ]);
});

test("an IPO subscription pre-pays cash with its fee, and the depot keeps it without a depot transaction", () => {
  const subscription = {
    ...row(
      "4f0d7a6c-2b5e-4a9c-9d6f-7e8b9c0d1e2f",
      "IPO_SUBSCRIPTION",
      "",
      "-1000.000000",
      "-1.00",
    ),
    category: "CASH",
    asset_class: "STOCK",
    name: "Example",
    symbol: "US0000000001",
  };
  expect(
    tradeRepublic.extractions.cash[1]([subscription])?.[0]?.cash?.amount,
  ).toBe("-1001.00");
  expect(tradeRepublic.extractions.depot[1]([subscription])).toEqual([
    { data: subscription, identity: subscription.transaction_id },
  ]);
});
