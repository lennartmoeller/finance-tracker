import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import type { Account, SyncInput } from "@finance-tracker/api/contract";

export const accounts = pgTable("accounts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  bank: text().$type<Account["bank"]>().notNull(),
  type: text().$type<Account["type"]>().notNull(),
  iban: text().notNull().unique(),
  lastSyncedAt: timestamp({ withTimezone: true }),
});

export const rawTransactions = pgTable(
  "raw_transactions",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    accountId: integer()
      .notNull()
      .references(() => accounts.id),
    source: text().notNull(),
    shapeVersion: integer().notNull(),
    identity: text().notNull(),
    data: jsonb().$type<SyncInput["rawTransactions"][number]>().notNull(),
  },
  (table) => [unique().on(table.accountId, table.identity)],
);
