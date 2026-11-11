import type { Price, Transaction } from "@finance-tracker/shared/contract";
import { decimalProduct, decimalSum } from "@finance-tracker/shared/decimal";

export type DepotFigures = { invested: string } & (
  { marketValue: string } | { unpriced: string[] }
);

const negated = (value: string) =>
  value.startsWith("-") ? value.slice(1) : `-${value}`;

export function balance(transactions: Transaction[]): string | null {
  const amounts = transactions.flatMap(({ cash }) =>
    cash ? [cash.amount] : [],
  );
  return amounts.length ? decimalSum(amounts) : null;
}

export function depotFigures(
  transactions: Transaction[],
  prices: Price[],
): DepotFigures | null {
  if (!transactions.length) return null;
  const invested = decimalSum([
    "0",
    ...transactions.flatMap(({ depot }) =>
      depot?.type === "trade" && depot.amount !== null ? [depot.amount] : [],
    ),
  ]);
  const holdings = new Map<string, { name: string; shares: string }>();
  for (const { depot } of transactions)
    if (depot?.quantity)
      holdings.set(depot.isin, {
        name: depot.securityName,
        shares: decimalSum([
          holdings.get(depot.isin)?.shares ?? "0",
          depot.quantity,
        ]),
      });
  const latest = new Map<string, Price>();
  for (const price of prices)
    if ((latest.get(price.isin)?.date ?? "") < price.date)
      latest.set(price.isin, price);
  let marketValue = "0";
  const unpriced: string[] = [];
  for (const [isin, { name, shares }] of holdings) {
    if (Number(shares) <= 0) continue;
    const price = latest.get(isin);
    if (price)
      marketValue = decimalSum([
        marketValue,
        decimalProduct(shares, price.price),
      ]);
    else unpriced.push(name);
  }
  return unpriced.length ? { invested, unpriced } : { invested, marketValue };
}

export const gain = (marketValue: string, invested: string) =>
  decimalSum([marketValue, negated(invested)]);
