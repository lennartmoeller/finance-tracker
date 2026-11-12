import type { DepotTransaction } from "./contract.ts";
import { cents } from "./decimal.ts";

export function depotFields(
  type: DepotTransaction["type"],
  shares: string,
  money: { amount: string; currency: string } | undefined,
): Pick<DepotTransaction, "type" | "quantity" | "amount" | "currency"> {
  const paid = type === "trade" || type === "distribution" ? money : undefined;
  return {
    type,
    quantity: type === "distribution" ? null : shares,
    amount: paid ? cents(paid.amount) : null,
    currency: paid?.currency ?? null,
  };
}
