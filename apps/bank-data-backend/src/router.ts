import { implement, ORPCError } from "@orpc/server";
import { desc, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { contract } from "@finance-tracker/bank-data-api/contract";
import { extractTransactions } from "./extraction.ts";
import { accounts, transactions } from "./schema.ts";

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
      remove: os.account.remove.handler(({ input }) =>
        db.transaction(async (tx) => {
          await tx
            .delete(transactions)
            .where(eq(transactions.accountId, input.id));
          const [account] = await tx
            .delete(accounts)
            .where(eq(accounts.id, input.id))
            .returning();
          if (!account) throw accountNotFound();
        }),
      ),
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
        const rows = extracted.map((row) => ({
          ...row,
          accountId: account.id,
          shapeVersion: input.shapeVersion,
        }));
        const imported = rows.length
          ? await tx
              .insert(transactions)
              .values(rows)
              .onConflictDoNothing()
              .returning({ id: transactions.id })
          : [];
        return {
          imported: imported.length,
          skipped: rows.length - imported.length,
        };
      }),
    ),
    transaction: {
      list: os.transaction.list.handler(() =>
        db
          .select()
          .from(transactions)
          .orderBy(desc(transactions.date), desc(transactions.id)),
      ),
    },
  });
}
