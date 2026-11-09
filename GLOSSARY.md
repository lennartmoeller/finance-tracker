# Finance tracker

A self-hosted system that collects the transactions of one user's accounts at several banks, stores them, and shows them.

## Language

### Banks and accounts

**User**:
The one person who runs the system, holds every account in it, and owns all its data.
_Avoid_: owner, customer, PSU

**Bank**:
A company where the user holds accounts, such as ING, Deutsche Bank, Trade Republic, finvesto or PayPal.
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
A transaction exactly as its source delivered it, kept unchanged together with its source and shape version.
_Avoid_: original transaction, import record

**Normalized transaction**:
A transaction in the system's own structure, extracted from a raw transaction.
_Avoid_: parsed transaction, cleaned transaction

**Identity**:
What makes two deliveries of a transaction the same transaction, always within one account.
_Avoid_: dedup key, fingerprint

### Ingestion

**Source**:
An origin of raw transactions: one adapter per bank website.
_Avoid_: provider, feed, connector

**Adapter**:
The part of the extension that reads one bank's transactions from the user's session.
_Avoid_: scraper, connector, plugin

**Shape version**:
One version of the structure a source's raw transactions follow; a change at the source adds a shape version beside the existing ones.
_Avoid_: schema, format

**Shape mismatch**:
Raw transactions that match none of their source's shape versions.
_Avoid_: validation error, parse error

**Sync**:
A run the user starts that reads one source's raw transactions and ingests them.
_Avoid_: refresh, import, update

**Ingest**:
The backend step that stores a sync's raw transactions and extracts them, skipping each one whose identity is already stored and importing every other one.
_Avoid_: import (for the step)

**Extraction**:
Turning a raw transaction into a normalized transaction.
_Avoid_: parsing, mapping, normalization
