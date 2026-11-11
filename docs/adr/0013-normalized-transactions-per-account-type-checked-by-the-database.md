# Normalized transactions per account type, checked by the database

Each transaction is stored once with its raw transaction, and its normalized transaction in a table per account type: cash transactions, whose money fields are all required, and depot transactions, whose type says whether a row is a trade, a reinvestment, a fee, a tax or a distribution, with quantity and amount empty where the type has none.
The database itself rejects a row that breaks a rule, by constraints and, where no constraint reaches, by triggers: a depot transaction's fields follow its type, a normalized transaction sits only on a transaction of its account's type, a raw transaction never changes, and an account keeps its bank and type.
A distribution's amount is the income it paid, so only a trade's amount is invested money; this amends [ADR 0012](./0012-depot-amounts-as-invested-money.md), which gave income no amount so that every depot amount added up, and [ADR 0011](./0011-raw-transactions-read-by-their-account.md), under which only the API kept an account's bank and type unchanged.

## Considered options

- One table per kind of depot transaction, which requires every column and gives each one meaning, but splits a depot's history over three tables and costs three insert targets and three shapes for the guarantee that no field is empty.
- One table for every normalized transaction, which leaves a cash account's amount optional as well.
- One row per trade that references the depot and the cash account, which needs the two sides matched where a bank delivers them in two exports, as Deutsche Bank does, and has no cash account to name where a bank delivers only the depot's side, as finvesto does.
- An income column beside the amount, which keeps every depot amount adding up to invested money at the price of a column that is empty on most rows; a depot's sums read the type anyway.
- A table per account type for accounts too, with the account on the normalized transaction instead of the raw one, which enforces the fit by a plain foreign key but gives up the account name's uniqueness per bank, identity within one account, and the account of a raw transaction that has no normalized one.
- The account type repeated in three tables so that foreign keys enforce the fit, which needs no trigger but three columns that carry only the rule.
- Extraction and its tests as the only guard, which a bug or a hand-run fix gets past.
- A cash amount that must not be 0, which would reject a booking of 0.00 that a bank can deliver.

## Consequences

- A raw transaction that moves neither money nor shares, such as finvesto's notice of a charge, has no normalized transaction, and consumers receive it with none.
- A new bank, account type or depot transaction type changes a constraint and so [needs a migration](../../CONTRIBUTING.md#change-the-database-schema); a new depot transaction type's fields are stated in the schema, which the compiler demands.
- Triggers are written by hand into the migration, because Drizzle's schema holds none, and the database's rules are checked by hand, because the tests run without a database.
