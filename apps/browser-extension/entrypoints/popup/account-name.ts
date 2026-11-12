import type { Account } from "@finance-tracker/shared/contract";

export const accountNameIssue = (
  accounts: readonly Account[],
  bank: string,
  name: string,
  id?: number,
) =>
  accounts.some(
    (account) =>
      account.bank === bank && account.name === name && account.id !== id,
  )
    ? `${bank} already has an account named “${name}”.`
    : undefined;
