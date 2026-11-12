import { ORPCError } from "@orpc/server";
import type { Pool } from "pg";
import { identify } from "@finance-tracker/shared/identity";
import type { Account, SyncInput } from "@finance-tracker/shared/contract";
import { accountNotFound } from "./accounts.ts";
import { banks } from "./banks.ts";

const securityNamers = [...banks.values()]
  .sort(
    (a, b) =>
      (a.securityNameRank ?? Infinity) - (b.securityNameRank ?? Infinity) ||
      a.name.localeCompare(b.name),
  )
  .map(({ name }) => name);

export async function sync(
  db: Pool,
  { accountId, shapeVersion, rawTransactions }: SyncInput,
) {
  const client = await db.connect();
  try {
    await client.query("begin");
    const [account] = (
      await client.query<Pick<Account, "bank" | "type">>(
        "update accounts set last_synced_at = now() where id = $1 returning bank, type",
        [accountId],
      )
    ).rows;
    if (!account) throw accountNotFound();
    const extracted = banks
      .get(account.bank)
      ?.extractions[account.type]?.[shapeVersion]?.(rawTransactions);
    if (!extracted)
      throw new ORPCError("BAD_REQUEST", {
        message: `The raw transactions don't match ${account.bank} ${account.type} shape version ${shapeVersion.toString()}.`,
      });
    const rows = identify(extracted);
    const imported = new Map(
      (
        await client.query<{ id: number; identity: string }>(
          `insert into transactions (account_id, shape_version, identity, data)
          select $1, $2, identity, data from jsonb_to_recordset($3::jsonb) as raw(identity text, data jsonb)
          on conflict do nothing returning id, identity`,
          [accountId, shapeVersion, JSON.stringify(rows)],
        )
      ).rows.map(({ id, identity }) => [identity, id]),
    );
    const fresh = rows.flatMap(({ identity, cash, depot }) => {
      const transaction_id = imported.get(identity);
      return transaction_id ? [{ transaction_id, cash, depot }] : [];
    });
    const cash = fresh.flatMap(({ transaction_id, cash }) =>
      cash ? [{ ...cash, transaction_id }] : [],
    );
    const depot = fresh.flatMap(({ transaction_id, depot }) =>
      depot ? [{ ...depot, transaction_id }] : [],
    );
    const securities = new Map(
      depot.map(({ isin, securityName }) => [isin, securityName]),
    );
    await client.query(
      `insert into cash_transactions select * from jsonb_populate_recordset(null::cash_transactions, $1::jsonb)`,
      [JSON.stringify(cash)],
    );
    await client.query(
      `insert into securities (isin, name, named_by)
      select key, value, $2::text from jsonb_each_text($1::jsonb)
      on conflict (isin) do update set name = excluded.name, named_by = excluded.named_by
      where array_position($3::text[], excluded.named_by) < array_position($3::text[], securities.named_by)`,
      [
        JSON.stringify(Object.fromEntries(securities)),
        account.bank,
        securityNamers,
      ],
    );
    await client.query(
      `insert into depot_transactions select * from jsonb_populate_recordset(null::depot_transactions, $1::jsonb)`,
      [JSON.stringify(depot)],
    );
    await client.query("commit");
    return { imported: imported.size, skipped: rows.length - imported.size };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
