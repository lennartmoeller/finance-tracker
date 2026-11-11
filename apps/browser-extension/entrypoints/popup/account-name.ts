import type { Account } from "@finance-tracker/bank-data-api/contract";

export function accountNameTaken(
  accounts: readonly Account[],
  bank: Account["bank"],
  name: string,
  id?: number,
): string | undefined {
  return accounts.some(
    (account) =>
      account.bank === bank && account.name === name && account.id !== id,
  )
    ? `${bank} already has an account named “${name}”.`
    : undefined;
}
