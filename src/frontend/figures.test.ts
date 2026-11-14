import { expect, test } from "vitest";
import type {
  DepotTransaction,
  Price,
  Transaction,
} from "@finance-tracker/shared/contract";
import {
  balance,
  dailyBalances,
  dailyTotals,
  dailyValues,
  depotFigures,
} from "./figures.ts";

const fund = "IE00B3RBWM25";
const amazon = "US0231351067";
const talanx = "DE000TLX1005";

const depot = (
  date: string,
  isin: string,
  type: DepotTransaction["type"],
  quantity: string | null,
  amount: string | null,
) =>
  ({
    date,
    isin,
    securityName: isin === talanx ? "Talanx" : isin,
    type,
    quantity,
    amount,
  }) as DepotTransaction;

const fundAndTalanx = [
  depot("2026-01-02", fund, "trade", "2", "200.00"),
  depot("2026-03-02", fund, "distribution", null, "4.10"),
  depot("2026-03-05", fund, "reinvestment", "0.04", null),
  depot("2026-06-01", fund, "fee", "-0.1", null),
  depot("2026-01-02", talanx, "trade", "1", "120.00"),
];

const prices: Price[] = [
  { isin: fund, date: "2026-03-04", price: "102.6" },
  { isin: fund, date: "2026-11-09", price: "100" },
  { isin: fund, date: "2026-11-10", price: "110.5" },
  { isin: talanx, date: "2026-11-05", price: "129.9" },
  { isin: talanx, date: "2026-11-06", price: "130.8" },
];

test("a cash account's balance adds its amounts to its start balance, and an account with neither has none", () => {
  const cash = (amount: string) => ({ cash: { amount } }) as Transaction;
  expect(balance(null, [cash("100.00"), cash("-12.95"), cash("0.50")])).toBe(
    "87.55",
  );
  expect(balance("1250.00", [cash("-1230.55"), cash("-19.45")])).toBe("0.00");
  expect(balance("12.00", [])).toBe("12.00");
  expect(balance(null, [])).toBeNull();
});

test("the daily balances start with the start balance on the first transaction's day, step by each day's amounts, and end today unless the account is closed", () => {
  const cash = (date: string, amount: string) =>
    ({ cash: { date, amount } }) as Transaction;
  const account = {
    startBalance: "100.00",
    transactions: [
      cash("2026-11-03", "20.00"),
      cash("2026-11-01", "-10.50"),
      cash("2026-11-03", "-0.50"),
    ],
  };
  const balances = [
    { date: "2026-11-01", balance: 89.5 },
    { date: "2026-11-02", balance: 89.5 },
    { date: "2026-11-03", balance: 109 },
  ];
  expect(dailyBalances([{ ...account, closed: false }], "2026-11-04")).toEqual([
    ...balances,
    { date: "2026-11-04", balance: 109 },
  ]);
  expect(dailyBalances([{ ...account, closed: true }], "2026-11-04")).toEqual(
    balances,
  );
});

test("a reinvested distribution is no paid-out one, even where the shares it bought are worth cents more", () => {
  expect(depotFigures(fundAndTalanx, prices)).toEqual({
    invested: "320.00",
    purchases: "320.00",
    marketValue: "345.170",
    reinvested: "4.104",
    paidOut: "0",
    gain: "25.170",
  });
});

test("a security sold at a profit has a gain above 0 and purchases to measure it against", () => {
  expect(
    depotFigures(
      [
        depot("2026-01-02", amazon, "trade", "0.3", "50.00"),
        depot("2026-02-02", amazon, "trade", "-0.3", "-60.00"),
      ],
      prices,
    ),
  ).toMatchObject({ invested: "-10.00", purchases: "50.00", gain: "10.00" });
});

test("a held security without a price is named instead of a market value", () => {
  expect(
    depotFigures(
      fundAndTalanx,
      prices.filter(({ isin }) => isin !== talanx),
    ),
  ).toEqual({
    invested: "320.00",
    purchases: "320.00",
    unpriced: ["Talanx"],
  });
});

test("the daily values carry Friday's price over the weekend, step invested money on a trade's day, and end on the last day held or today", () => {
  const trades = [
    depot("2026-11-06", fund, "trade", "1", "100.00"),
    depot("2026-11-09", fund, "trade", "1", "105.00"),
    depot("2026-11-10", fund, "trade", "-2", "-224.00"),
  ];
  const fundPrices = [
    { isin: fund, date: "2026-11-06", price: "100" },
    { isin: fund, date: "2026-11-09", price: "105" },
    { isin: fund, date: "2026-11-10", price: "112" },
    { isin: fund, date: "2026-11-11", price: "115" },
  ];
  expect(
    dailyValues(trades.slice(0, 2), fundPrices, "2026-11-12").at(-1),
  ).toEqual({
    date: "2026-11-12",
    marketValue: 230,
    invested: 205,
    gain: 25,
  });
  expect(dailyValues(trades, fundPrices, "2026-11-12")).toEqual([
    { date: "2026-11-06", marketValue: 100, invested: 100, gain: 0 },
    { date: "2026-11-07", marketValue: 100, invested: 100, gain: 0 },
    { date: "2026-11-08", marketValue: 100, invested: 100, gain: 0 },
    { date: "2026-11-09", marketValue: 210, invested: 205, gain: 5 },
  ]);
});

test("a security neither held nor sold, such as one that only paid a distribution, has no daily values", () => {
  expect(
    dailyValues(
      [depot("2026-03-02", fund, "distribution", null, "4.10")],
      prices,
      "2026-11-12",
    ),
  ).toEqual([]);
});

test("the daily totals add the cash balance, carried past its last day, to the depots' market value, which counts 0 before their first day", () => {
  expect(
    dailyTotals(
      [
        { date: "2026-11-01", balance: 100 },
        { date: "2026-11-02", balance: 50 },
      ],
      [
        { date: "2026-11-02", marketValue: 10, invested: 10, gain: 0 },
        { date: "2026-11-03", marketValue: null, invested: 10, gain: null },
        { date: "2026-11-04", marketValue: 12, invested: 10, gain: 2 },
      ],
    ),
  ).toEqual([
    { date: "2026-11-01", total: 100, cash: 100, depots: 0 },
    { date: "2026-11-02", total: 60, cash: 50, depots: 10 },
    { date: "2026-11-03", total: null, cash: 50, depots: null },
    { date: "2026-11-04", total: 62, cash: 50, depots: 12 },
  ]);
});
