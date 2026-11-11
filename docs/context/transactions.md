# Transactions

## Depot amounts as invested money

**Id:** 61823f39-7074-47f5-b70c-e7b5e94916bc
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** ADR 0012, removed from docs/adr/ (see git history), as amended by ADR 0013

A trade's amount is the change in the money invested in the depot, seen from the depot, so a purchase adds what it cost, fees included, and a sale subtracts what it paid out.
A distribution's amount is the income it paid, and a reinvestment or a fee or tax paid by selling shares gets no amount.

**Reason:** invested money changes only when the user moves money between the depot and another account.
A charge paid by selling shares, such as finvesto's fees and Vorabpauschale, pays the bank or the tax office while the user takes nothing out, so it lowers the depot's market value, not the money invested in it.

**Rejected alternative:** the cash each transaction moved, seen from the account that paid, which made a depot add up to minus its purchases plus its income, a figure that means neither.

**Rejected alternative:** income without an amount, or in an income column beside the amount, so that every depot amount adds up to invested money; the column would be empty on most rows, and a depot's sums read the type anyway.

**Consequence:** a trade appears in the depot and the account that paid with opposite amounts, so it cancels when adding up across accounts, and a purchase paid with income, such as the one following a stock perk, counts like any other.

**Consequence:** a purchase paid through the user's salary, such as finvesto's or Deutsche Bank's `RECEIPT`, has no cash transaction to cancel it and counts at the market value its bank delivers where the bank delivers no price paid, because a discount on it is pay the user invests.

## Normalized transactions per account type, checked by the database

**Id:** 1c839c68-8767-49ee-ad4c-20216776c3a7
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** ADR 0013, removed from docs/adr/ (see git history)

Each transaction is stored once with its raw transaction, and its normalized transaction in a table per account type: cash transactions, whose money fields are all required, and depot transactions, whose type says whether a row is a trade, a reinvestment, a fee, a tax or a distribution, with quantity and amount empty where the type has none.
The database itself rejects a row that breaks a rule, by constraints and, where no constraint reaches, by triggers.

**Reason:** extraction and its tests alone let a bug or a hand-run fix store a row that breaks a rule.

**Rejected alternative:** one table per kind of depot transaction, which requires every column and gives each one meaning, but splits a depot's history over three tables and costs three insert targets and three shapes for the guarantee that no field is empty.

**Rejected alternative:** one table for every normalized transaction, which leaves a cash account's amount optional as well.

**Rejected alternative:** one row per trade that references the depot and the cash account, which needs the two sides matched where a bank delivers them in two exports, as Deutsche Bank does, and has no cash account to name where a bank delivers only the depot's side, as finvesto does.

**Rejected alternative:** a table per account type for accounts too, with the account on the normalized transaction instead of the raw one, which enforces the fit by a plain foreign key but gives up the account name's uniqueness per bank, identity within one account, and the account of a raw transaction that has no normalized one.

**Rejected alternative:** the account type repeated in three tables so that foreign keys enforce the fit, which needs no trigger but three columns that carry only the rule.

**Rejected alternative:** a cash amount that must not be 0, which would reject a booking of 0.00 that a bank can deliver.

**Consequence:** a raw transaction that moves neither money nor shares, such as finvesto's notice of a charge, has no normalized transaction.

**Consequence:** a new bank, account type or depot transaction type changes a constraint and so [needs a migration](../../CONTRIBUTING.md#change-the-database-schema).
