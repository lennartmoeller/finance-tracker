import { sql, type SQL } from "drizzle-orm";
import {
  check,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { bank } from "@finance-tracker/bank-data-api/bank";
import {
  accountType,
  type Account,
  type DepotTransaction,
  type Transaction,
} from "@finance-tracker/bank-data-api/contract";
import { currencyPattern } from "@finance-tracker/bank-data-api/currency";

const filled = (column: AnyPgColumn) => sql`${column} <> ''`;

const matches = (column: AnyPgColumn, pattern: string) =>
  sql`${column} ~ ${sql.raw(`'${pattern}'`)}`;

const oneOf = (column: AnyPgColumn, values: readonly string[]) =>
  sql`${column} in (${sql.raw(values.map((value) => `'${value}'`).join(", "))})`;

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
    check("accounts_name_filled", filled(table.name)),
    check("accounts_bank_known", oneOf(table.bank, bank.options)),
    check("accounts_type_known", oneOf(table.type, accountType.options)),
    check("accounts_number_filled", filled(table.number)),
  ],
);

export const transactions = pgTable(
  "transactions",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    accountId: integer()
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    shapeVersion: integer().notNull(),
    identity: text().notNull(),
    data: jsonb().$type<Transaction["data"]>().notNull(),
  },
  (table) => [
    unique().on(table.accountId, table.identity),
    check("transactions_identity_filled", filled(table.identity)),
  ],
);

export const securities = pgTable(
  "securities",
  {
    isin: text().primaryKey(),
    name: text().notNull(),
  },
  (table) => [
    check(
      "securities_isin_format",
      matches(table.isin, "^[A-Z]{2}[A-Z0-9]{9}[0-9]$"),
    ),
    check("securities_name_filled", filled(table.name)),
  ],
);

const transactionId = () =>
  integer()
    .primaryKey()
    .references(() => transactions.id, { onDelete: "cascade" });

export const cashTransactions = pgTable(
  "cash_transactions",
  {
    transactionId: transactionId(),
    date: date().notNull(),
    amount: numeric().notNull(),
    currency: text().notNull(),
    counterparty: text(),
    description: text(),
  },
  (table) => [
    check(
      "cash_transactions_currency_format",
      matches(table.currency, currencyPattern.source),
    ),
    check("cash_transactions_counterparty_filled", filled(table.counterparty)),
    check("cash_transactions_description_filled", filled(table.description)),
  ],
);

export const depotTransactions = pgTable(
  "depot_transactions",
  {
    transactionId: transactionId(),
    date: date().notNull(),
    isin: text()
      .notNull()
      .references(() => securities.isin),
    type: text().$type<DepotTransaction["type"]>().notNull(),
    quantity: numeric(),
    amount: numeric(),
    currency: text(),
    description: text(),
  },
  (table) => {
    const sharesSold = sql`${table.quantity} < 0 and ${table.amount} is null`;
    const fieldsOfType: Record<DepotTransaction["type"], SQL> = {
      trade: sql`${table.quantity} <> 0 and sign(${table.amount}) = sign(${table.quantity})`,
      reinvestment: sql`${table.quantity} > 0 and ${table.amount} is null`,
      fee: sharesSold,
      tax: sharesSold,
      distribution: sql`${table.quantity} is null and ${table.amount} > 0`,
    };
    return [
      // A CHECK passes on NULL, so "is true" turns a missing quantity or amount into a violation.
      check(
        "depot_transactions_fields_of_type",
        sql`(${sql.join(
          Object.entries(fieldsOfType).map(
            ([type, fields]) =>
              sql`(${table.type} = ${sql.raw(`'${type}'`)} and ${fields})`,
          ),
          sql` or `,
        )}) is true`,
      ),
      check(
        "depot_transactions_currency_with_amount",
        sql`(${table.amount} is null) = (${table.currency} is null)`,
      ),
      check(
        "depot_transactions_currency_format",
        matches(table.currency, currencyPattern.source),
      ),
      check("depot_transactions_description_filled", filled(table.description)),
    ];
  },
);
