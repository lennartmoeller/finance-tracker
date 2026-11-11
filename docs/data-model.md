# Data model

The backend stores each transaction once with its raw transaction, gives cash accounts and depots a table each for the normalized transactions extracted from it, and lets the database itself reject data that makes no sense; why is recorded in [ADR 0013](./adr/0013-normalized-transactions-per-account-type-checked-by-the-database.md).

```mermaid
erDiagram
  accounts ||--o{ transactions : "has"
  transactions ||--o| cash_transactions : "extracts to"
  transactions ||--o| depot_transactions : "extracts to"
  securities ||--o{ depot_transactions : "appears in"

  accounts {
    integer id PK
    text name "unique per bank"
    text bank
    text type "cash or depot"
    text number "unique per bank"
    timestamptz last_synced_at "optional"
  }
  transactions {
    integer id PK
    integer account_id FK
    integer shape_version
    text identity "unique per account"
    jsonb data "the raw transaction"
  }
  securities {
    text isin PK
    text name
    text named_by "the bank whose name it holds"
  }
  cash_transactions {
    integer transaction_id PK, FK
    date date
    numeric amount
    text currency
    text counterparty "optional"
    text description "optional"
  }
  depot_transactions {
    integer transaction_id PK, FK
    date date
    text isin FK
    text type
    numeric quantity "optional, by type"
    numeric amount "optional, by type"
    text currency "optional, with amount"
    text description "optional"
  }
```

Every column is required unless the diagram marks it optional, and an optional column without a value is `NULL`.
A security holds the fullest name a bank delivered for its ISIN: finvesto's before Deutsche Bank's before Trade Republic's.

## Normalized transactions

- A normalized transaction belongs to the account of its transaction, so a trade's cash side is a cash transaction of the account that paid, wherever [its bank delivers one](./architecture.md#raw-data-and-shape-versions).
- A raw transaction is extracted to at most one normalized transaction, and one that moves neither money nor shares, such as finvesto's notice of a charge, to none.
- A cash transaction's amount is the change of the balance, fees and taxes included, and its date the day the balance changed, such as a card purchase's booking date rather than its purchase date.
- A normalized transaction's counterparty and description hold its bank's text as delivered, such as ING's `VISA ` prefix or the line breaks in its remittance text, so tidying them is not extraction's job.

## Depot transaction types

| Type | Holds | `quantity` | `amount` |
| --- | --- | --- | --- |
| `trade` | a buy or a sale | not 0: above for a buy, below for a sale | the quantity's sign: what the buy cost, fees included, or what the sale paid out |
| `reinvestment` | shares bought with a distribution that stays in the depot | above 0 | `NULL` |
| `fee` | shares sold to pay a fee | below 0 | `NULL` |
| `tax` | shares sold to pay a tax | below 0 | `NULL` |
| `distribution` | income a security pays, such as a dividend, a fund distribution or a stock perk | `NULL` | above 0: what was paid, after taxes |

- A depot's shares of a security add up from the quantities of its depot transactions.
- A depot's [invested money](./adr/0012-depot-amounts-as-invested-money.md) adds up from the amounts of its trades alone, because a distribution's amount is income.

## Database rules

The database enforces each of these, so no writer can store a row that breaks one; the [schema](../apps/backend/src/schema.ts) holds the constraints and the [migration](../apps/backend/drizzle/0000_init.sql) the triggers.

- A depot transaction has one of the five types, its quantity and amount follow that type as the [types table](#depot-transaction-types) states, and it has a currency exactly when it has an amount.
- A trigger lets a cash transaction reference only a cash account's transaction and a depot transaction only a depot's, so no transaction has both.
- A trigger keeps a row of `transactions` unchanged, so a raw transaction stays as its bank delivered it.
- An account's type is cash or depot and its bank one the system knows, and a trigger keeps both unchanged, because [they decide how its raw transactions are read](./adr/0011-raw-transactions-read-by-their-account.md).
- A cash or depot transaction's amount has exactly two decimals, so a bank's sub-cent amount fails its sync instead of being rounded.
- A security is named by a bank the system knows.
- A currency is three capital letters, and an ISIN is two letters, nine letters or digits, and one digit.
- A text column never holds an empty string, so `NULL` is the only way to hold no value.
