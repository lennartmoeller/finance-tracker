import type { Pool } from "pg";
import type { Settings } from "@finance-tracker/shared/contract";

export async function readSettings(db: Pool): Promise<Settings> {
  const { rows } = await db.query<Settings>(
    `select transactions_start as "transactionsStart" from settings`,
  );
  return rows[0] ?? { transactionsStart: null };
}

export async function updateSettings(
  db: Pool,
  { transactionsStart }: Settings,
) {
  await db.query(
    `insert into settings (transactions_start) values ($1)
    on conflict (id) do update set transactions_start = excluded.transactions_start`,
    [transactionsStart],
  );
}
