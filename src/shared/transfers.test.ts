import { expect, test } from "vitest";
import type { DepotTransaction } from "./contract.ts";
import { transferPartners } from "./transfers.ts";

const [ingCash, tradeRepublicCash, tradeRepublicDepot] = [1, 2, 3];

const cash = (id: number, accountId: number, date: string, amount: string) => ({
  id,
  accountId,
  cash: {
    date,
    amount,
    currency: "EUR",
    counterparty: null,
    description: null,
  },
  depot: null,
});

const depot = (
  id: number,
  date: string,
  type: DepotTransaction["type"],
  amount: string,
) => ({
  id,
  accountId: tradeRepublicDepot,
  cash: null,
  depot: {
    date,
    isin: "IE00B3RBWM25",
    securityName: "FTSE All-World",
    securityLogo: null,
    type,
    quantity: type === "trade" ? "7.767" : null,
    amount,
    currency: "EUR",
    description: null,
  },
});

test("equal opposite amounts on two accounts pair one to one, closest dates first, trades included and distributions not", () => {
  expect(
    transferPartners([
      cash(1, ingCash, "2026-09-11", "-2000.00"),
      cash(2, ingCash, "2026-09-14", "-2000.00"),
      cash(3, ingCash, "2026-09-14", "-2000.00"),
      cash(4, ingCash, "2026-09-16", "-2000.00"),
      cash(5, tradeRepublicCash, "2026-09-11", "2000.00"),
      cash(6, tradeRepublicCash, "2026-09-13", "2000.00"),
      cash(7, tradeRepublicCash, "2026-09-14", "2000.00"),
      cash(8, tradeRepublicCash, "2026-09-16", "2000.00"),
      cash(9, tradeRepublicCash, "2026-10-28", "-1000.00"),
      depot(10, "2026-10-28", "trade", "1000.00"),
      cash(11, ingCash, "2026-10-30", "-50.00"),
      cash(12, ingCash, "2026-10-30", "50.00"),
      depot(13, "2026-11-02", "distribution", "12.30"),
      cash(14, ingCash, "2026-11-02", "-12.30"),
      cash(15, ingCash, "2026-11-03", "-300.00"),
      cash(16, tradeRepublicCash, "2026-11-11", "300.00"),
    ]),
  ).toEqual(
    new Map([
      [1, 5],
      [5, 1],
      [2, 7],
      [7, 2],
      [3, 6],
      [6, 3],
      [4, 8],
      [8, 4],
      [9, 10],
      [10, 9],
    ]),
  );
});
