import { expect, test } from "vitest";
import { identify } from "@finance-tracker/shared/identity";
import deutscheBank from "./extract.ts";

const { cash, depot } = deutscheBank.extractions;

const booking = Object.assign(Array<string>(18).fill(""), {
  0: "3.5.2026",
  1: "3.5.2026",
  3: "Max Mustermann",
  4: "Umbuchung",
  11: "-100,8",
  17: "EUR",
});

test("a booking pads its date and its amount's cents, its identity hashes the whole row, and a depot rejects it", () => {
  const rows = cash[1]([booking]);
  expect(rows).toEqual([
    {
      data: booking,
      identity: { hashOf: booking },
      cash: {
        date: "2026-05-03",
        amount: "-100.80",
        currency: "EUR",
        counterparty: "Max Mustermann",
        description: "Umbuchung",
      },
    },
  ]);
  expect(identify(rows ?? []).map(({ identity }) => identity)).toEqual([
    "d34e638f26499efc1d5a6b2af2f8a545b5deccd7f3a1215dbea8d0b7dc89b02e",
  ]);
  expect(depot[1]([booking])).toBeUndefined();
});

test("a receipt is a trade with its cost and shares, a dividend a distribution with what it paid, and each identity hashes the transaction in shape order, whatever order its keys come in", () => {
  const transaction = (subType: string, total: string) => ({
    type: subType === "RECEIPT" ? "SECURITY" : "EARNING",
    subType,
    bookDate: "2025-09-25",
    quantity: "15.00",
    security: { wkn: "000001", isin: "DE0000000001", name: "Muster AG" },
    valueDate: "2025-09-25",
    createDate: "2025-09-25",
    calculatedAmounts: {
      totalAmountEuroCurrency: { amount: total, currency: "EUR" },
    },
    settlementCharges: {},
    securitiesAccountId: "100000000001",
  });
  const rows = depot[1]([
    transaction("RECEIPT", "-1714.50"),
    transaction("DIVIDEND_DISBURSEMENT", "103.52"),
  ]);
  const common = {
    date: "2025-09-25",
    isin: "DE0000000001",
    securityName: "Muster AG",
    currency: "EUR",
  };
  expect(rows?.map((row) => row.depot)).toEqual([
    {
      ...common,
      type: "trade",
      quantity: "15.00",
      amount: "1714.50",
      description: "RECEIPT",
    },
    {
      ...common,
      type: "distribution",
      quantity: null,
      amount: "103.52",
      description: "DIVIDEND_DISBURSEMENT",
    },
  ]);
  expect(identify(rows ?? []).map(({ identity }) => identity)).toEqual([
    "d8a553906fa6755ac2627aa0bd59017d884be2fe2a83ad81e7bf0538a28a6a1c",
    "8d93b1ff07b7e01a81c580d2146c34ef12b2eda39a4124d56efd8ed0148cf8e9",
  ]);
});
