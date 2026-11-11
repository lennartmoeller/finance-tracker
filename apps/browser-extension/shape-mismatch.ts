import type { Account } from "@finance-tracker/bank-data-api/contract";

export function shapeMismatch(bank: Account["bank"]): Error {
  return new Error(
    `${bank} changed the format of its transactions, so nothing was sent. The adapter needs a new shape version.`,
  );
}
