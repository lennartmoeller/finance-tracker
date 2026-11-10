import type { Account } from "./contract.ts";

export const accountTypeNames: Record<Account["type"], string> = {
  giro: "Giro account",
  savings: "Savings account",
  cash: "Cash account",
  depot: "Depot",
};
