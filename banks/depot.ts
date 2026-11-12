import type { DepotTransaction } from "@finance-tracker/shared/contract";
import { cents } from "@finance-tracker/shared/decimal";

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
