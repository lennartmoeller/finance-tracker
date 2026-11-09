import { implement, ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { contract } from "@finance-tracker/api/contract";
import { identifyIngTransactions } from "./identity.ts";
import { accounts, rawTransactions } from "./schema.ts";

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
        const [account] = await db
          .insert(accounts)
          .values(input)
          .onConflictDoNothing()
          .returning();
        if (!account)
          throw new ORPCError("CONFLICT", {
            message: "An account with this IBAN exists.",
          });
        return account;
      }),
      list: os.account.list.handler(() =>
        db.select().from(accounts).orderBy(accounts.id),
      ),
    },
    sync: os.sync.handler(({ input }) =>
      db.transaction(async (tx) => {
        const [account] = await tx
          .update(accounts)
          .set({ lastSyncedAt: new Date() })
          .where(eq(accounts.id, input.accountId))
          .returning();
        if (!account)
          throw new ORPCError("NOT_FOUND", {
            message: "The account does not exist.",
          });
        const rows = identifyIngTransactions(input.rawTransactions).map(
          (row) => ({
            ...row,
            accountId: account.id,
            source: account.bank,
            shapeVersion: input.shapeVersion,
          }),
        );
        const imported = rows.length
          ? await tx
              .insert(rawTransactions)
              .values(rows)
              .onConflictDoNothing()
              .returning({ id: rawTransactions.id })
          : [];
        return {
          imported: imported.length,
          skipped: rows.length - imported.length,
        };
      }),
    ),
  });
}
