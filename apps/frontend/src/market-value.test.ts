import { expect, test } from "vitest";
import type { Price, Transaction } from "@finance-tracker/shared/contract";
import { marketValue } from "./market-value.ts";

const fund = "IE00B3RBWM25";
const talanx = "DE000TLX1005";

const depotTransaction = (
  isin: string,
  securityName: string,
  quantity: string | null,
) => ({ depot: { isin, securityName, quantity } }) as Transaction;

const transactions = [
  depotTransaction(fund, "Vanguard FTSE All-World", "2"),
  depotTransaction(fund, "Vanguard FTSE All-World", "0.5"),
  depotTransaction(fund, "Vanguard FTSE All-World", "-0.1"),
  depotTransaction(fund, "Vanguard FTSE All-World", null),
  depotTransaction("US0231351067", "Amazon", "0.3"),
  depotTransaction("US0231351067", "Amazon", "-0.3"),
  depotTransaction(talanx, "Talanx", "1"),
];

test("a depot's market value adds each held security's shares times its latest price, as of the oldest of those prices", () => {
  const prices: Price[] = [
    { isin: fund, date: "2026-11-10", price: "110.5" },
    { isin: fund, date: "2026-11-09", price: "100" },
    { isin: talanx, date: "2026-11-05", price: "129.9" },
    { isin: talanx, date: "2026-11-06", price: "130.8" },
  ];

  expect(marketValue(transactions, prices)).toEqual({
    amount: "396.00",
    pricedOn: "2026-11-06",
  });
});

test("a depot holding a security without a price names it instead of a market value", () => {
  expect(
    marketValue(transactions, [
      { isin: fund, date: "2026-11-10", price: "110.5" },
    ]),
  ).toEqual({ unpriced: ["Talanx"] });
});
