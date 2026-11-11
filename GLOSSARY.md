# Finance tracker

A self-hosted system that collects the transactions of one user's accounts at several banks, stores them, and lets the user view and manage them.

## Language

### Banks and accounts

**User**:
The one person who runs the system, holds every account in it, and owns all its data.
_Avoid_: owner, customer, PSU

**Bank**:
A company where the user holds accounts, such as ING, Deutsche Bank, Trade Republic or finvesto.
_Avoid_: institution, ASPSP, provider

**Account**:
A cash account or depot that the user holds at a bank.
_Avoid_: user account, login, product names

**Cash account**:
An account that holds money rather than securities, whether for payments, for interest or for settling a depot's trades.
_Avoid_: giro account, savings account, checking account, current account, clearing account, settlement account

**Depot**:
An account that holds securities or fund shares.
_Avoid_: portfolio, securities account, brokerage account

**Security**:
A stock or fund whose shares a depot holds, identified by its ISIN.
_Avoid_: asset, instrument, position

**Account number**:
The number by which the bank identifies an account: its IBAN where it has one, otherwise the number the bank shows for it, such as a depot number.
_Avoid_: account ID, identifier, IBAN (for every account)

**Account name**:
The name the user gives an account, unique among the accounts at its bank, by which the popup shows it.
_Avoid_: label, nickname, alias

**Balance**:
The money a cash account holds, which its opening balance and its transactions add up to.
_Avoid_: Saldo, account total

**Opening balance**:
The balance the user enters once for an account, which its transactions carry forward to the account's balance.
_Avoid_: initial balance, starting balance

**Invested money**:
The money the user has put into a depot and not taken out: what its purchases cost, fees included, less what its sales paid out.
_Avoid_: cost basis, net deposits, depot value

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
A transaction in the system's own structure, extracted from a raw transaction: a cash transaction or a depot transaction.
_Avoid_: parsed transaction, cleaned transaction

**Cash transaction**:
A normalized transaction of a cash account: the money one transaction adds to or takes from its balance.
_Avoid_: payment, booking, cash movement

**Depot transaction**:
A normalized transaction of a depot, which concerns one security and is a trade, a reinvestment, a distribution, or a fee or tax paid by selling shares.
_Avoid_: position change, trade (for every depot transaction)

**Trade**:
A depot transaction that buys or sells shares of a security for money.
_Avoid_: order, execution

**Reinvestment**:
A depot transaction that buys shares with a distribution that stays in the depot.
_Avoid_: accumulation

**Distribution**:
A depot transaction in which a security pays income, such as a dividend, a fund's payout or a stock perk.
_Avoid_: dividend (for every distribution), payout, income

**Identity**:
What makes two deliveries of a transaction the same transaction, always within one account.
_Avoid_: dedup key, fingerprint

**Counterparty**:
The person or company on the other side of a cash transaction, as its bank names it, such as `VISA ROSSMANN <store number>`.
_Avoid_: payee, payer, merchant, recipient

### Brands

**Brand**:
The company behind counterparties, identified by its website's domain, whose name stands for them, such as "Uber Eats" for `VISA UBER *EATS HELP.UBER.C`.
_Avoid_: merchant, vendor

**Pattern**:
The case-insensitive regular expression the user gives a brand, which decides the counterparties that belong to it.
_Avoid_: rule, brand rule, regex

### Ingestion

**Adapter**:
The part of the browser extension that reads one bank's transactions from the user's session.
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

### Apps

**Backend**:
The app that ingests syncs, stores all of the system's data in PostgreSQL, and serves it to the frontend and the browser extension.
_Avoid_: bank data service, server

**Frontend**:
The web app in which the user views and manages the system's data, so far each account's normalized transactions beside their raw transactions, with the account's balance or, for a depot, its invested money.
_Avoid_: transaction viewer, consumer, web UI

**Browser extension**:
The Firefox extension whose adapters read transactions from the bank websites in the user's sessions, and whose popup creates, renames, removes and syncs accounts.
_Avoid_: extension, add-on, plugin
