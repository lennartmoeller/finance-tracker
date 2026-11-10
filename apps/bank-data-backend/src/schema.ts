import {
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import type {
  Account,
  Transaction,
} from "@finance-tracker/bank-data-api/contract";

export const accounts = pgTable(
  "accounts",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: text().notNull(),
    bank: text().$type<Account["bank"]>().notNull(),
    type: text().$type<Account["type"]>().notNull(),
    number: text().notNull(),
    lastSyncedAt: timestamp({ withTimezone: true }),
  },
  (table) => [
    unique().on(table.bank, table.number),
    unique().on(table.bank, table.name),
  ],
);

export const transactions = pgTable(
  "transactions",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    accountId: integer()
      .notNull()
      .references(() => accounts.id),
    shapeVersion: integer().notNull(),
    identity: text().notNull(),
    data: jsonb().$type<Transaction["data"]>().notNull(),
    date: date().notNull(),
    amount: numeric(),
    currency: text(),
    counterparty: text(),
    description: text(),
    isin: text(),
    securityName: text(),
    quantity: numeric(),
  },
  (table) => [unique().on(table.accountId, table.identity)],
);
