import type { Pool } from "pg";
import { withApiErrors } from "./database-errors.ts";

// Clears the transactions' corrections and those of the partners they were pinned to, then stores the new ones; the database checks each pin when the transaction commits.
async function correct(
  db: Pool,
  ids: number[],
  corrections: [transactionId: number, partnerId: number | null][],
) {
  const client = await db.connect();
  try {
    await client.query("begin");
    await client.query(
      "delete from transfer_corrections where transaction_id = any($1) or partner_id = any($1)",
      [ids],
    );
    await client.query(
      "insert into transfer_corrections (transaction_id, partner_id) select * from unnest($1::integer[], $2::integer[])",
      [
        corrections.map(([transactionId]) => transactionId),
        corrections.map(([, partnerId]) => partnerId),
      ],
    );
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export const pinTransfer = (
  db: Pool,
  { id, partnerId }: { id: number; partnerId: number },
) =>
  withApiErrors(
    correct(
      db,
      [id, partnerId],
      [
        [id, partnerId],
        [partnerId, id],
      ],
    ),
  );

export const excludeTransfers = (db: Pool, { ids }: { ids: number[] }) =>
  withApiErrors(
    correct(
      db,
      ids,
      ids.map((id) => [id, null]),
    ),
  );

export const releaseTransfers = (db: Pool, { ids }: { ids: number[] }) =>
  withApiErrors(correct(db, ids, []));
