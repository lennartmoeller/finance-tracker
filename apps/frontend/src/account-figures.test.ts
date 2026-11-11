import { expect, test } from "vitest";
import type { Price, Transaction } from "@finance-tracker/shared/contract";
import { balance, depotFigures, gain } from "./account-figures.ts";

const fund = "IE00B3RBWM25";
const talanx = "DE000TLX1005";

const depotTransaction = (
  isin: string,
  securityName: string,
  type: string,
  quantity: string | null,
  amount: string | null,
) => ({ depot: { isin, securityName, type, quantity, amount } }) as Transaction;

const transactions = [
  depotTransaction(fund, "Vanguard FTSE All-World", "trade", "2", "200.00"),
  depotTransaction(
    fund,
    "Vanguard FTSE All-World",
    "reinvestment",
    "0.5",
    null,
  ),
  depotTransaction(fund, "Vanguard FTSE All-World", "fee", "-0.1", null),
  depotTransaction(
    fund,
    "Vanguard FTSE All-World",
    "distribution",
    null,
    "4.10",
  ),
  depotTransaction("US0231351067", "Amazon", "trade", "0.3", "50.00"),
  depotTransaction("US0231351067", "Amazon", "trade", "-0.3", "-60.00"),
  depotTransaction(talanx, "Talanx", "trade", "1", "120.00"),
];

test("a cash account's balance adds up its amounts, and an account without transactions has none", () => {
  const cash = (amount: string) => ({ cash: { amount } }) as Transaction;

  expect(balance([cash("100.00"), cash("-12.95"), cash("0.50")])).toBe("87.55");
  expect(balance([])).toBeNull();
});

test("a depot's market value adds each held security's shares times its latest price, beside the money its trades invested", () => {
  const prices: Price[] = [
    { isin: fund, date: "2026-11-10", price: "110.5" },
    { isin: fund, date: "2026-11-09", price: "100" },
    { isin: talanx, date: "2026-11-05", price: "129.9" },
    { isin: talanx, date: "2026-11-06", price: "130.8" },
  ];

  const figures = depotFigures(transactions, prices);

  expect(figures).toEqual({ invested: "310.00", marketValue: "396.00" });
  expect(gain("396.00", "310.00")).toBe("86.00");
});

test("a depot holding a security without a price names it instead of a market value", () => {
  expect(
    depotFigures(transactions, [
      { isin: fund, date: "2026-11-10", price: "110.5" },
    ]),
  ).toEqual({ invested: "310.00", unpriced: ["Talanx"] });
});
