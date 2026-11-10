# Finance tracker

A self-hosted system that collects the transactions of one user's accounts at several banks, stores them, and serves them to consumers.

## Language

### Banks and accounts

**User**:
The one person who runs the system, holds every account in it, and owns all its data.
_Avoid_: owner, customer, PSU

**Bank**:
A company where the user holds accounts, such as ING, Deutsche Bank, Trade Republic or finvesto.
_Avoid_: institution, ASPSP, provider

**Account**:
A giro account, savings account, cash account or depot that the user holds at a bank.
_Avoid_: user account, login, product names

**Giro account**:
An account for everyday payments and transfers.
_Avoid_: checking account, current account, Girokonto

**Savings account**:
An account that holds money for interest rather than for payments.
_Avoid_: call money account, Tagesgeld account

**Cash account**:
A broker's account that holds the money not invested in its depot and settles the depot's trades.
_Avoid_: clearing account, settlement account

**Depot**:
An account that holds securities or fund shares.
_Avoid_: portfolio, securities account, brokerage account

**Account number**:
The number by which the bank identifies an account: its IBAN where it has one, otherwise the number the bank shows for it, such as a depot number.
_Avoid_: account ID, IBAN (for every account)

**Account name**:
The name the user gives an account, unique among the accounts at its bank, by which the popup shows it.
_Avoid_: label, nickname, alias

**Opening balance**:
The balance the user enters once for an account, which its transactions carry forward to the account's balance.
_Avoid_: initial balance, starting balance

**Session**:
The user's logged-in visit to a bank website.

### Transactions

**Transaction**:
A single movement of money or securities on an account, such as a payment, transfer, interest posting, buy, sell or distribution.
_Avoid_: entry, posting, Umsatz

**Booked transaction**:
A transaction the bank has settled, so its amount, date and ID no longer change.
_Avoid_: posted transaction, settled transaction

**Pending transaction**:
A transaction the bank has not booked yet, whose amount, date or ID can still change.
_Avoid_: provisional transaction

**Raw transaction**:
A transaction exactly as its bank delivered it, kept unchanged together with its shape version.
_Avoid_: original transaction, import record

**Normalized transaction**:
A transaction in the system's own structure, extracted from a raw transaction.
_Avoid_: parsed transaction, cleaned transaction

**Identity**:
What makes two deliveries of a transaction the same transaction, always within one account.
_Avoid_: dedup key, fingerprint

### Ingestion

**Adapter**:
The part of the extension that reads one bank's transactions from the user's session.
_Avoid_: scraper, connector, plugin

**Shape version**:
One version of the structure in which a bank delivers one account type's raw transactions; a format change or a switch to another export adds a shape version beside the existing ones.
_Avoid_: schema, format, source

**Shape mismatch**:
Raw transactions that match none of their account's shape versions.
_Avoid_: validation error, parse error

**Sync**:
A run the user starts that reads one account's raw transactions from its bank's website and ingests them.
_Avoid_: refresh, import, update

**Last sync**:
The time of an account's most recent successful sync, which shows how fresh its transactions are.
_Avoid_: data freshness, last update, last refresh

**Ingest**:
The backend step that stores a sync's raw transactions and extracts them, skipping each one whose identity is already stored and importing every other one.
_Avoid_: import (for the step)

**Extraction**:
Turning a raw transaction into a normalized transaction.
_Avoid_: parsing, mapping, normalization

### Services

**Bank data service**:
The service that collects the transactions of the user's accounts from their banks' websites, stores them, and serves them to consumers as normalized transactions together with their raw transactions.
_Avoid_: ingestion service, bank sync, importer

**Consumer**:
A service that reads transactions through the bank data service's API, such as the transaction viewer or a future finance logic backend.
_Avoid_: client, downstream service

**Transaction viewer**:
The consumer that lists each account's normalized transactions beside their raw transactions, so the user can check the bank data service's data.
_Avoid_: data quality frontend, inspector
