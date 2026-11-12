# Ingestion

## Ingestion through the extension only

**Id:** eff3eade-324a-4347-b66f-2472c46fdd51
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** ADRs 0002 and 0003, removed from docs/adr/ (see git history); the Enable Banking sign-up and measurements of 2026-11-09 in issue #4

The browser extension reads every account from its bank's website, and no data service sits between a bank and the backend.

**Reason:** the user wants all the data a bank offers, and the bank's website offers more than its PSD2 interface for every account but one.
Through Enable Banking, the ING cash account ING offers for linking adds the transaction ID, the transaction date and the counterparty IBAN on 5% of debits, while its website adds the running balance; the Deutsche Bank cash account adds the transaction ID and ISO 20022 transaction codes, while its website adds BIC, mandate reference, creditor ID, foreign fees and the ultimate party.
More fields count for more than the bank's transaction ID, because [identity](../contract/ingestion.md#adapters) falls back to a hash of stable fields where a source has no ID.
That ING cash account alone is richer through Enable Banking, but ING offers its other cash account for no linking, so the extension needs an ING adapter anyway, and that adapter reads both in the same session.
PSD2 covers payment accounts only, so the depots and the Trade Republic and finvesto accounts take the extension in any case.

**Rejected alternative:** Enable Banking, in its free restricted mode, for every account whose bank delivers usable PSD2 data, and the extension for the rest; dropped once the measurements showed the websites richer.

**Rejected alternative:** Enable Banking for the ING cash account alone, which keeps a backend client, a consent flow, an HTTPS callback with a trusted certificate, a private key and 180-day renewals for one account's transaction ID and transaction date.

**Rejected alternative:** the bank's transaction ID beating extra fields, which would have kept the Deutsche Bank cash account on Enable Banking.

**Rejected alternative:** a paid aggregator such as open-banking.io, Lunch Flow or Synci, which resells Enable Banking or GoCardless and so delivers the same data per bank through one more party; GoCardless takes [no new sign-ups](https://bankaccountdata.gocardless.com/new-signups-disabled).

**Rejected alternative:** FinTS, which is free and direct but makes the backend store the bank PIN, needs a [product registration](https://www.fints.org/de/hersteller/produktregistrierung) with Die Deutsche Kreditwirtschaft, and at ING returns no transaction ID and only 90 days.

**Rejected alternative:** unofficial Trade Republic clients such as pytr, which keep a session from a phone-and-PIN login and break whenever Trade Republic changes its login.

**Rejected alternative:** the Parqet Connect API, which covers Trade Republic securities only, without card merchants, as a third route.

**Rejected alternative:** the banks' own APIs, which exclude private customers: Deutsche Bank's dbAPI serves businesses only, ING requires eIDAS certificates, and PayPal serves licensed partners or Business accounts.

**Rejected alternative:** finAPI, Tink, Salt Edge, Plaid, TrueLayer, Yapily, wealthAPI, Ponto and BankSync, which exceed a budget of €10 a month, serve businesses only, or keep Germany on a waitlist.

## PayPal out of scope

**Id:** 0ff14e1c-0c4c-432d-b45c-c198787d6d50
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** ADR 0009, removed from docs/adr/ (see git history); the exploration of 2026-11-10
**Revisit when:** PayPal offers a synchronous transaction export, or the system needs PayPal's own transactions
**See:** ingestion.md#ingestion-through-the-extension-only — eff3eade-324a-4347-b66f-2472c46fdd51 — as of 2026-11-11

The PayPal account stays out of the system.

**Reason:** PayPal's website offers its transactions only as activity reports it generates asynchronously, and the user rates the account as not worth what reading them costs.
A report carries every field the extension would want, but covers at most 12 months within the last seven years, takes about four minutes to generate, and makes PayPal email the user; the report list holds 12 reports, and older reports lose their files while still listed.

**Rejected alternative:** reports since the last sync, one per sync reaching back before the account's last sync, which waits minutes for an email each time and breaks the rule that a [sync](../contract/ingestion.md) reads the full history the bank offers.

**Rejected alternative:** the full history on every sync, which costs seven or eight reports, emails and minutes of waiting per sync and pushes the user's own reports out of the list.

**Rejected alternative:** a two-step sync that requests the reports and imports them on the next sync, at two clicks per sync.

**Rejected alternative:** scraping the server-rendered activity page, which lacks the running balance, the balance impact and the related transaction codes.

**Rejected alternative:** Enable Banking, which the system dropped and which reached only 376 days back on this account.

**Consequence:** PayPal payments reach the system only where a cash account pays PayPal, as PayPal's debits without item titles.

## Trade Republic through its CSV transaction export

**Id:** 382ed119-7b7e-4b25-ab69-5d45ef6fae67
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** ADR 0004, removed from docs/adr/ (see git history)
**Revisit when:** the Trade Republic export delivers a pending transaction

The Trade Republic adapter reads the web app's CSV transaction export, and its raw transactions take the UUID of each row as their identity.

**Reason:** one request returns the cash account's and the depot's whole history, with ISIN, shares, price, fee, tax and counterparty IBAN as columns and a UUID per row.

**Rejected alternative:** the WebSocket timeline that the unofficial client pytr reads, which reaches the same history but carries counterparty IBAN, shares, price and fee only in one detail request per event, as display text in the session's language.

**Consequence:** the timeline's event IDs differ from the export's UUIDs, so moving to the timeline would import every transaction again under new identities.

**Consequence:** the export has no status column, so it counts as booked transactions only, and a pending row needs a filter or a new shape version.

## Deutsche Bank cash account through its CSV transaction export

**Id:** adfbf8ed-08c4-49d2-9ed3-2bd91b676452
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** ADR 0006, removed from docs/adr/ (see git history)

The Deutsche Bank adapter reads the cash account from the web app's CSV transaction export, which has no transaction ID, so a raw transaction's identity is a hash of the whole row with an occurrence counter.

**Reason:** the export carries every field the website offers beyond PSD2, the ultimate party (Abweichender Empfänger) among them.

**Rejected alternative:** the web app's JSON transactions, which carry the bank's transaction ID, a transaction type and a timestamp, but no ultimate party, and need one detail request per transaction for everything beyond counterparty, amount, booking date and purpose.

**Consequence:** moving to the JSON transactions would import every transaction again under new identities.

## Deutsche Bank depot through its JSON transactions

**Id:** 686ff2e6-d4b7-4951-8a09-b527350913c2
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** ADR 0007, removed from docs/adr/ (see git history), as amended by ADR 0011

The Deutsche Bank adapter reads the depot from the web app's JSON transactions, which have no transaction ID, so a raw transaction's identity is a hash of the whole transaction with an occurrence counter.

**Reason:** unlike the cash account's server-side export, the depot's CSV export is built in the page from these same JSON transactions, for the filter's period only, so it carries a subset of their fields.

**Rejected alternative:** the CSV the web app builds for the depot, which the Wealthfolio companion parses, and which means rebuilding the page's own conversion in the adapter, with fewer fields and German number formats.

**Consequence:** moving to the CSV would import every transaction again under new identities, as Deutsche Bank depot shape version 2.

## finvesto depot through its CSV transaction export

**Id:** 11be374e-3329-442d-89c7-b21a4bbf9bd5
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** ADR 0008, removed from docs/adr/ (see git history), as amended by ADR 0011

The finvesto adapter reads the depot from the CSV transaction export of FNZ Bank SE's portal at `portal.fnz.de`, finvesto being a brand of FNZ Bank SE, and its raw transactions take the export's Ref. Nr., the bank's unique reference, as their identity.

**Reason:** one request returns the depot's whole history with every field the portal holds for a transaction, fees, taxes, cash distributions and the Vorabpauschale among them.

**Rejected alternative:** the portal's JSON transaction overview, which carries ISO dates, dot decimals and the bank's transaction ID, but is paged and lacks fees, taxes and distribution amounts, leaving some transactions without any amount.

**Rejected alternative:** the Online-Postkorb's PDF statements, which need text extraction from documents made for reading.

**Consequence:** moving to the portal's JSON transactions would import every transaction again under new identities.

**Consequence:** the export answers for the cash account with the same header and no rows, so the cash account can be read from the same export once it has transactions.

## Raw transactions read by their account

**Id:** aef5e287-882f-486e-9b4e-37a23394ddea
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** ADR 0011, removed from docs/adr/ (see git history), as amended by ADR 0013

A raw transaction is read by its account's bank and account type and by its shape version, and no transaction stores a source.
Shape versions count per bank and account type: a format change within an export and a switch to another export each add one.

**Reason:** an account's bank and type never change and already decide which export its transactions come from.

**Rejected alternative:** a source stored with every raw transaction, which repeats what the account says and lets one account type's sync be stored on another account of the same bank.

**Rejected alternative:** bank and account type in the sync input, which would let the API contract validate the raw transactions and the compiler pair each adapter with it, but repeats what the account says, so the backend validates after loading the account instead.

**Consequence:** account types sharing an export, such as Trade Republic's cash account and depot, each count its shape versions, so a change to it adds a version to each, and a type that joins it later starts at its own version 1.

**Consequence:** changing an account's bank or type would misread its raw transactions, so a database trigger keeps both unchanged.

## Sparkasse entered by hand

**Id:** 870bd184-e61b-4b73-99d9-7a19878e49b0
**Type:** decision
**Status:** active
**Evidence:** unknown
**Source:** maintainer request and decisions in a planning dialogue, 2026-11-12
**Revisit when:** a Sparkasse account is to be kept current
**See:** ingestion.md#ingestion-through-the-extension-only — eff3eade-324a-4347-b66f-2472c46fdd51 — as of 2026-11-12
**See:** banks.md#a-bank-declares-only-the-account-types-the-extension-syncs — bc02b8d8-1203-472c-970a-f5651ec803a7 — as of 2026-11-12

Sparkasse is a bank the system knows, so it stores Sparkasse accounts and their transactions, but the browser extension has no Sparkasse adapter, the one exception to ingestion through the extension only.
Its account is inserted into the database by hand, and its raw transactions reach the backend through the same `sync` the extension calls, sent by a script that stays out of the repository, as the [contract](../contract/ingestion.md#by-hand) shows.

**Reason:** the maintainer wants the history of a closed Sparkasse current account, which only the legacy Finance application held, and asked for no Sparkasse sync, now or later; that half is confirmed, while why a later Sparkasse account would not be synced either was not stated and is unknown.
`sync` is the one path that hashes, extracts and inserts, with the database's checks behind it, so the hand path adds no second write path, and through the frontend's address it reaches production without the database password or a port-forward past the network policy.

**Rejected alternative:** a Sparkasse adapter in the browser extension, ruled out by the maintainer.

**Rejected alternative:** a script writing to the database directly in one transaction, which repeats `sync`'s inserts and needs a port-forward and the database password in production.

**Rejected alternative:** the import script committed to the repository and deleted after its production run, which ships one-off code in a release.

**Consequence:** `sync` sets the account's last sync time although no extension synced it, and a hand import is atomic per account, not as a whole.

## ING's export without Referenz as shape version 2

**Id:** 4be7a9a4-b2cb-4f70-8f2a-b2335b342339
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** maintainer decision in a planning dialogue, 2026-11-12, after comparing the legacy ING rows with the ING rows both instances stored
**See:** ingestion.md#raw-transactions-read-by-their-account — aef5e287-882f-486e-9b4e-37a23394ddea — as of 2026-11-12

ING's export as the legacy Finance application stored it lacks the `Referenz` column ING added in autumn 2026, so it is ING cash shape version 2, holding its nine cells as ING delivered them, with an identity that hashes them without the running balance, as version 1's does.
The legacy history entered each instance only for the bookings dated before the earliest booking that instance had already stored from a sync, read from the instance at import time.

**Reason:** from that day on, every legacy row matched a stored row field for field, and the stored rows carry the `Referenz` the legacy rows lack; before it, the legacy rows and the stored rows added up exactly to ING's newest running balance in both instances.
ING's export reaches back 390 days from the day of a sync, so no later sync delivers a booking before that day.

**Rejected alternative:** matching each legacy row against the stored rows by their fields, which gave the same result on that data but stores a booking twice wherever ING changed its text between the two exports.

**Rejected alternative:** rebuilding the legacy rows into shape version 1 with an empty `Referenz`, which invents a cell ING never sent and still needs the cutoff.

**Rejected alternative:** numbering the older format 0, since ING delivered it first; a shape version must be positive, and versions count in the order the system learns a format.

**Consequence:** a booking's version 2 row and its version 1 row have different identities, so the two must never overlap: the import refused an ING account that had no synced rows yet, whose next sync would have stored the overlap again.

## Two hand-created rows close the Sparkasse account

**Id:** 9aaf944c-e2e6-440c-bdbc-f330a1f2adfc
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** maintainer decision in a planning dialogue, 2026-11-12; the legacy Finance application's bookkeeping and ING's incoming payout as evidence of the amounts and the date
**See:** ingestion.md#sparkasse-entered-by-hand — 870bd184-e61b-4b73-99d9-7a19878e49b0 — as of 2026-11-12
**See:** figures.md#a-cash-balance-starts-from-an-optional-start-balance — a53f4fef-6c7a-463b-bf4d-189f9d8b24ff — as of 2026-11-12

The Sparkasse export ends two weeks before the account's closure, so two rows in the Sparkasse shape, created by hand and saying so in their description, record the fee charged on closing and the payout of the remaining balance to the ING current account.
Each fills only the cells the evidence states, with the value date taken as the booking date, and every other cell empty.

**Reason:** with them, every balance from the first exported booking on is right and the closed account ends at 0.00; the amounts and the date come from the legacy bookkeeping, which matches the export to the cent, and from ING's incoming payout the day after, marked as the balance of a closed account.

**Rejected alternative:** the export alone, which leaves the closed account, and with it the total, too high by both amounts for good.

**Rejected alternative:** a start balance lowered by both amounts, which ends at 0.00 but puts every earlier balance too low.

**Consequence:** the account holds two raw transactions its bank never delivered in this form, the only ones in the system.
