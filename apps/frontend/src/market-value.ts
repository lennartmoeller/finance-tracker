import type { Price, Transaction } from "@finance-tracker/shared/contract";
import { decimalProduct, decimalSum } from "@finance-tracker/shared/decimal";

export function marketValue(transactions: Transaction[], prices: Price[]) {
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
  let amount = "0";
  let pricedOn: string | undefined;
  const unpriced: string[] = [];
  for (const [isin, { name, shares }] of holdings) {
    if (Number(shares) <= 0) continue;
    const price = latest.get(isin);
    if (!price) {
      unpriced.push(name);
      continue;
    }
    amount = decimalSum([amount, decimalProduct(shares, price.price)]);
    if (!pricedOn || price.date < pricedOn) pricedOn = price.date;
  }
  return unpriced.length ? { unpriced } : { amount, pricedOn };
}
