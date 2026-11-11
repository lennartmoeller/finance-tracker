import { implement, ORPCError } from "@orpc/server";
import { desc, eq, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { contract } from "@finance-tracker/bank-data-api/contract";
import { extractTransactions } from "./extraction.ts";
import {
  accounts,
  cashTransactions,
  depotTransactions,
  transactions,
  securities,
} from "./schema.ts";

const accountNotFound = () =>
  new ORPCError("NOT_FOUND", { message: "The account does not exist." });

async function withoutConflict<T>(query: Promise<T>): Promise<T> {
  try {
    return await query;
  } catch (error) {
    // Drizzle wraps node-postgres's error, which reports a unique violation as SQLSTATE 23505 with the constraint's name.
    const { cause } = error as {
      cause?: { code?: string; constraint?: string };
    };
    if (cause?.code !== "23505") throw error;
    throw new ORPCError("CONFLICT", {
      message: `This bank already has an account with this ${cause.constraint === "accounts_bank_name_unique" ? "name" : "number"}.`,
    });
  }
}

export function createRouter(db: NodePgDatabase, apiToken: string) {
  const os = implement(contract)
    .$context<{ authorization: string | undefined }>()
    .use(({ context, next }) => {
      if (context.authorization !== `Bearer ${apiToken}`)
        throw new ORPCError("UNAUTHORIZED");
      return next();
    });

  return os.router({
    account: {
      create: os.account.create.handler(async ({ input }) => {
        const [account] = await withoutConflict(
          db.insert(accounts).values(input).returning(),
        );
        if (!account) throw new Error("PostgreSQL returned no account.");
        return account;
      }),
      list: os.account.list.handler(() =>
        db.select().from(accounts).orderBy(accounts.id),
      ),
      rename: os.account.rename.handler(async ({ input }) => {
        const [account] = await withoutConflict(
          db
            .update(accounts)
            .set({ name: input.name })
            .where(eq(accounts.id, input.id))
            .returning(),
        );
        if (!account) throw accountNotFound();
      }),
      remove: os.account.remove.handler(async ({ input }) => {
        const [account] = await db
          .delete(accounts)
          .where(eq(accounts.id, input.id))
          .returning();
        if (!account) throw accountNotFound();
      }),
    },
    sync: os.sync.handler(({ input }) =>
      db.transaction(async (tx) => {
        const [account] = await tx
          .update(accounts)
          .set({ lastSyncedAt: new Date() })
          .where(eq(accounts.id, input.accountId))
          .returning();
        if (!account) throw accountNotFound();
        const extracted = extractTransactions(account, input.rawTransactions);
        if (!extracted)
          throw new ORPCError("BAD_REQUEST", {
            message: `The raw transactions don't match ${account.bank} ${account.type} shape version ${input.shapeVersion.toString()}.`,
          });
        const imported = extracted.length
          ? await tx
              .insert(transactions)
              .values(
                extracted.map(({ identity, data }) => ({
                  accountId: account.id,
                  shapeVersion: input.shapeVersion,
                  identity,
                  data,
                })),
              )
              .onConflictDoNothing()
              .returning()
          : [];
        const ids = new Map(imported.map(({ identity, id }) => [identity, id]));
        const cash = [];
        const depot = [];
        for (const row of extracted) {
          const transactionId = ids.get(row.identity);
          if (transactionId === undefined) continue;
          if (row.cash) cash.push({ transactionId, ...row.cash });
          if (row.depot) depot.push({ transactionId, ...row.depot });
        }
        if (cash.length) await tx.insert(cashTransactions).values(cash);
        if (depot.length) {
          await tx
            .insert(securities)
            .values(
              depot.map(({ isin, securityName }) => ({
                isin,
                name: securityName,
              })),
            )
            .onConflictDoNothing();
          await tx.insert(depotTransactions).values(depot);
        }
        return {
          imported: imported.length,
          skipped: extracted.length - imported.length,
        };
      }),
    ),
    transaction: {
      list: os.transaction.list.handler(async () => {
        const rows = await db
          .select({
            transaction: transactions,
            cash: cashTransactions,
            depot: depotTransactions,
            security: securities,
          })
          .from(transactions)
          .leftJoin(
            cashTransactions,
            eq(cashTransactions.transactionId, transactions.id),
          )
          .leftJoin(
            depotTransactions,
            eq(depotTransactions.transactionId, transactions.id),
          )
          .leftJoin(securities, eq(securities.isin, depotTransactions.isin))
          .orderBy(
            sql`coalesce(${cashTransactions.date}, ${depotTransactions.date}) desc nulls last`,
            desc(transactions.id),
          );
        return rows.map(({ transaction, cash, depot, security }) => ({
          ...transaction,
          cash,
          depot: depot && security && { ...depot, securityName: security.name },
        }));
      }),
    },
  });
}
