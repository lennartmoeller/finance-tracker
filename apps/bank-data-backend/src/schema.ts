import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import type {
  Account,
  SyncInput,
} from "@finance-tracker/bank-data-api/contract";

export const accounts = pgTable(
  "accounts",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    bank: text().$type<Account["bank"]>().notNull(),
    type: text().$type<Account["type"]>().notNull(),
    number: text().notNull(),
    lastSyncedAt: timestamp({ withTimezone: true }),
  },
  (table) => [unique().on(table.bank, table.number)],
);

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
