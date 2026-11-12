import { ORPCError } from "@orpc/server";
import type { DatabaseError, Pool } from "pg";
import { accountNumberIssue } from "@finance-tracker/shared/account-number";
import type { Account } from "@finance-tracker/shared/contract";
import { banks } from "./banks.ts";

const columns = `id, name, bank, type, number, last_synced_at as "lastSyncedAt"`;

export const accountNotFound = () =>
  new ORPCError("NOT_FOUND", { message: "The account does not exist." });

async function withoutConflict<T>(query: Promise<T>): Promise<T> {
  try {
    return await query;
  } catch (error) {
    const { code, constraint } = error as DatabaseError;
    if (code !== "23505") throw error;
    throw new ORPCError("CONFLICT", {
      message: `This bank already has an account with this ${constraint === "accounts_bank_name_key" ? "name" : "number"}.`,
    });
  }
}

export async function createAccount(
  db: Pool,
  { name, bank, type, number }: Omit<Account, "id" | "lastSyncedAt">,
): Promise<Account> {
  const format = banks.get(bank)?.accounts[type];
  const issue = format
    ? accountNumberIssue(bank, format, number)
    : `The extension syncs no ${type} account at ${bank}.`;
  if (issue) throw new ORPCError("BAD_REQUEST", { message: issue });
  const { rows } = await withoutConflict(
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

export async function renameAccount(
  db: Pool,
  { id, name }: Pick<Account, "id" | "name">,
) {
  const { rowCount } = await withoutConflict(
    db.query("update accounts set name = $2 where id = $1", [id, name]),
  );
  if (!rowCount) throw accountNotFound();
}

export async function removeAccount(db: Pool, { id }: Pick<Account, "id">) {
  const { rowCount } = await db.query("delete from accounts where id = $1", [
    id,
  ]);
  if (!rowCount) throw accountNotFound();
}
