import type { Account } from "@finance-tracker/bank-data-api/contract";

export function shapeMismatch(bank: Account["bank"]): Error {
  return new Error(
    `${bank} changed its export format, so nothing was sent; the adapter needs a new shape version.`,
  );
}
