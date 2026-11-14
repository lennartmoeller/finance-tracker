import type { AccountNumberFormat } from "./account-number.ts";
import type {
  Account,
  CashTransaction,
  DepotTransaction,
  SyncInput,
} from "./contract.ts";

export type Bank = {
  name: string;
  logo: string;
  accounts: Partial<Record<Account["type"], AccountNumberFormat>>;
};

export const syncedBy = (
  banks: readonly Bank[],
  { bank, type, closed }: Pick<Account, "bank" | "type" | "closed">,
) =>
  !closed &&
  banks.some(
    ({ name, accounts }) => name === bank && accounts[type] !== undefined,
  );

export type BankAdapter = Bank & {
  hosts: string[];
  permissions: string[];
  read: (
    account: Pick<Account, "type" | "number">,
  ) => Promise<Omit<SyncInput, "accountId">>;
};

export type Extracted = {
  identity: string | { hashOf: unknown };
  cash?: CashTransaction;
  depot?: Omit<DepotTransaction, "securityLogo">;
};

export type Extraction = (
  rawTransactions: unknown[],
) => (Extracted & { data: unknown })[] | undefined;

export type BankExtraction = Bank & {
  securityNameRank?: number;
  extractions: Partial<Record<Account["type"], Record<number, Extraction>>>;
};
