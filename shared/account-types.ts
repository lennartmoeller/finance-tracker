import type { Account } from "./contract.ts";

export const accountTypeNames: Record<Account["type"], string> = {
  cash: "Cash account",
  depot: "Depot",
};
