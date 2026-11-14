import { ORPCError } from "@orpc/server";
import type { Pool } from "pg";
import { accountNumberIssue } from "@finance-tracker/shared/account-number";
import type { Account } from "@finance-tracker/shared/contract";
import { banks } from "./banks.ts";
import { withApiErrors } from "./database-errors.ts";

const columns = `id, name, bank, type, number, last_synced_at as "lastSyncedAt", start_balance as "startBalance", closed`;

export const accountNotFound = () =>
  new ORPCError("NOT_FOUND", { message: "The account does not exist." });

export async function createAccount(
  db: Pool,
  {
    name,
    bank,
    type,
    number,
  }: Pick<Account, "name" | "bank" | "type" | "number">,
): Promise<Account> {
  const format = banks.get(bank)?.accounts[type];
  const issue = format
    ? accountNumberIssue(bank, format, number)
    : `The extension syncs no ${type} account at ${bank}.`;
  if (issue) throw new ORPCError("BAD_REQUEST", { message: issue });
  const { rows } = await withApiErrors(
    db.query<Account>(
      `insert into accounts (name, bank, type, number) values ($1, $2, $3, $4) returning ${columns}`,
      [name, bank, type, number],
    ),
  );
  const [account] = rows;
  if (!account) throw new Error("PostgreSQL returned no account.");
  return account;
}

export const listAccounts = async (db: Pool) =>
  (await db.query<Account>(`select ${columns} from accounts order by id`)).rows;

export async function updateAccount(
  db: Pool,
  {
    id,
    name,
    startBalance,
    closed,
  }: Pick<Account, "id" | "name" | "startBalance" | "closed">,
) {
  const { rowCount } = await withApiErrors(
    db.query(
      "update accounts set name = $2, start_balance = $3, closed = $4 where id = $1",
      [id, name, startBalance, closed],
    ),
  );
  if (!rowCount) throw accountNotFound();
}

export async function removeAccount(db: Pool, { id }: Pick<Account, "id">) {
  const { rowCount } = await db.query("delete from accounts where id = $1", [
    id,
  ]);
  if (!rowCount) throw accountNotFound();
}
