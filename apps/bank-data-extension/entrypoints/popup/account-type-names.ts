import type { Account } from "@finance-tracker/bank-data-api/contract";

export const accountTypeNames: Record<Account["type"], string> = {
  giro: "Giro account",
  savings: "Savings account",
  cash: "Cash account",
  depot: "Depot",
};
