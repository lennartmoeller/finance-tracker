import { sql, type SQL } from "drizzle-orm";
import {
  check,
  customType,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { bank } from "@finance-tracker/shared/bank";
import {
  accountType,
  type Account,
  type DepotTransaction,
  type Transaction,
} from "@finance-tracker/shared/contract";
import { currencyPattern } from "@finance-tracker/shared/currency";

const filled = (column: AnyPgColumn) => sql`${column} <> ''`;

const matches = (column: AnyPgColumn, pattern: string) =>
  sql`${column} ~ ${sql.raw(`'${pattern}'`)}`;

const oneOf = (column: AnyPgColumn, values: readonly string[]) =>
  sql`${column} in (${sql.raw(values.map((value) => `'${value}'`).join(", "))})`;

const inCents = (column: AnyPgColumn) => sql`scale(${column}) = 2`;

const setTogether = (column: AnyPgColumn, other: AnyPgColumn) =>
  sql`(${column} is null) = (${other} is null)`;

const domainFormat = "^([a-z0-9]([a-z0-9-]*[a-z0-9])?\\.)+[a-z]{2,}$";

const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });

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
    namedBy: text().$type<Account["bank"]>().notNull(),
  },
  (table) => [
    check(
      "securities_isin_format",
      matches(table.isin, "^[A-Z]{2}[A-Z0-9]{9}[0-9]$"),
    ),
    check("securities_name_filled", filled(table.name)),
    check("securities_named_by_known", oneOf(table.namedBy, bank.options)),
  ],
);

export const prices = pgTable(
  "prices",
  {
    isin: text()
      .notNull()
      .references(() => securities.isin),
    date: date().notNull(),
    price: numeric().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.isin, table.date] }),
    check("prices_price_positive", sql`${table.price} > 0`),
    check("prices_date_weekday", sql`extract(isodow from ${table.date}) < 6`),
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
    check("cash_transactions_amount_in_cents", inCents(table.amount)),
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
      check("depot_transactions_amount_in_cents", inCents(table.amount)),
      check(
        "depot_transactions_currency_with_amount",
        setTogether(table.amount, table.currency),
      ),
      check(
        "depot_transactions_currency_format",
        matches(table.currency, currencyPattern.source),
      ),
      check("depot_transactions_description_filled", filled(table.description)),
    ];
  },
);

export const brands = pgTable(
  "brands",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: text().notNull().unique(),
    pattern: text().notNull(),
    domain: text().notNull().unique(),
  },
  (table) => [
    check("brands_name_filled", filled(table.name)),
    // PostgreSQL raises on an invalid pattern, and a pattern that matches the empty string matches every counterparty.
    check("brands_pattern_valid", sql`not ('' ~* ${table.pattern})`),
    check("brands_domain_format", matches(table.domain, domainFormat)),
  ],
);

export const logos = pgTable(
  "logos",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    domain: text().unique(),
    isin: text()
      .unique()
      .references(() => securities.isin),
    image: bytea(),
    etag: text(),
  },
  (table) => [
    check(
      "logos_one_identifier",
      sql`(${table.domain} is null) <> (${table.isin} is null)`,
    ),
    check("logos_domain_format", matches(table.domain, domainFormat)),
    check("logos_etag_with_image", setTogether(table.image, table.etag)),
    check("logos_etag_filled", filled(table.etag)),
  ],
);
