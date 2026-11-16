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

**Consequence:** a new bank, account type or depot transaction type changes a constraint and so [the schema](../../CONTRIBUTING.md#change-the-database-schema).

## Transfers between accounts are recognised by equal opposite amounts on every read

**Id:** ef87172b-df77-4e67-8df8-5229ab435f42
**Type:** decision
**Status:** superseded
**Evidence:** confirmed
**Source:** maintainer decisions of 2026-11-15 in the planning dialogue behind the change, after a pairing probe over the local data
**Revisit when:** a wrong pair turns up, or the user wants to undo a pair by hand
**See:** transactions.md#depot-amounts-as-invested-money — 61823f39-7074-47f5-b70c-e7b5e94916bc — as of 2026-11-15
**Superseded by:** 1180c5ed-61dd-4500-a22a-668b28887ba7

Two transactions on different accounts form a transfer when their amounts are equal with opposite signs and their dates lie at most 7 days apart, paired one to one, closest dates first; a cash transaction and a depot trade take part, a distribution and a depot row without an amount do not.
`transaction.list` pairs them on every read through `src/shared/transfers.ts` and gives neither side a brand or category, while both stay stored as two transactions.

**Reason:** the maintainer wants money moved between own accounts, such as ING Cash to ING Savings or a Trade Republic purchase, to read as one transfer without labels; on the local data on 2026-11-15 the pairing found 123 transfers, 61 between cash accounts and 62 Trade Republic purchases, with no wrong pair and none missed, and the two sides of a transfer lay at most 4 days apart.

**Reason:** pairing on read stores nothing, so a later sync of the other account completes a pair by itself; pairing one to one, closest first, is a short loop in TypeScript that the unit tests reach, where SQL needs a recursive query, and a mutual-closest rule in SQL left two of four repeated 2,000 € transfers unpaired.

**Rejected alternative:** transfer rules on counterparty and description, precise but a new kind of rule to build and keep up, with family members sharing the owner's surname.

**Rejected alternative:** pairing only where the bank names the other account, by counterparty IBAN or Trade Republic's shared row, which never pairs ING Cash with ING Savings, since ING's export carries no IBAN.

**Rejected alternative:** pairing in the frontend, which leaves brands and categories on transfer sides in the API for every reader to drop; a link stored at sync, which a later sync of the other account or a deleted account must repair.

## Transfers between accounts are recognised by equal opposite amounts, named pairs first

**Id:** 1180c5ed-61dd-4500-a22a-668b28887ba7
**Type:** decision
**Status:** superseded
**Evidence:** confirmed
**Source:** maintainer decisions of 2026-11-15 in the entry this one replaces; maintainer decision of 2026-11-16 in a planning dialogue, after simulating the pairing over the stored transactions and four years of PayPal activity reports
**Revisit when:** a wrong pair turns up, or the user wants to undo a pair by hand
**See:** transactions.md#depot-amounts-as-invested-money — 61823f39-7074-47f5-b70c-e7b5e94916bc — as of 2026-11-16
**See:** ingestion.md#paypal-through-its-uploaded-activity-report — 54552782-c069-4547-9741-12a4dfe832f9 — as of 2026-11-16
**Superseded by:** ad8336e6-fda9-4e3e-9470-1b9c725b9c0d

Two transactions on different accounts form a transfer when their amounts are equal with opposite signs and their dates lie at most 7 days apart, paired one to one: first the pairs where one side's counterparty names the other account's bank as a whole word, ignoring case, then closest dates first.
A cash transaction and a depot trade take part, a distribution and a depot row without an amount do not.
`transaction.list` pairs them on every read through `src/shared/transfers.ts` and gives neither side a brand or category, while both stay stored as two transactions.

**Reason:** the maintainer wants money moved between own accounts, such as ING Cash to ING Savings, a Trade Republic purchase or a bank debit that funds a PayPal payment, to read as one transfer without labels; on the local data on 2026-11-15 the pairing found 123 transfers with no wrong pair and none missed, and the two sides of a transfer lay at most 4 days apart.

**Reason:** with PayPal as an account, closest dates first let 8 of PayPal's bank fundings pair with an unrelated bank transaction of the same amount closer in date and left the bank's debit to PayPal unpaired; with the named pair first, 434 of 436 bank transactions with counterparty PayPal pair with their PayPal row instead of 426, and none of the 126 pairs between the other accounts changes.

**Reason:** pairing on read stores nothing, so a later sync of the other account completes a pair by itself; pairing one to one is a short loop in TypeScript that the unit tests reach, where SQL needs a recursive query.

**Rejected alternative:** transfer rules on counterparty and description, precise but a new kind of rule to build and keep up, with family members sharing the owner's surname.

**Rejected alternative:** pairing only where the bank names the other account, by counterparty, IBAN or Trade Republic's shared row, which never pairs ING Cash with ING Savings, since ING's export carries no IBAN; naming only puts a pair first.

**Rejected alternative:** closest dates alone, which leaves 10 bank debits to PayPal as spending and lets 15 unrelated transactions disappear as transfers.

**Rejected alternative:** pairing in the frontend, which leaves brands and categories on transfer sides in the API for every reader to drop; a link stored at sync, which a later sync of the other account or a deleted account must repair.

**Consequence:** a payment to or from a person in PayPal can still pair with an unrelated bank transaction of the same amount, 7 times in four years.

**Rejected alternative:** linking a dividend's depot row with its cash arrival, which is income rather than money moved between accounts, so its cash side keeps its category; it can come later as a feature of its own.

**Consequence:** a coincidence pairs wrongly, such as a payment from one account and an equal refund into another within a week, and nothing lets the user undo a pair yet; the local data holds none, but its busy cash accounts overlapped for only two months.

**Consequence:** a purchase paid through salary, such as finvesto's or Deutsche Bank's `RECEIPT`, has no cash side and stays a plain trade.

## A transfer pairs automatically only on a proof the banks wrote

**Id:** ad8336e6-fda9-4e3e-9470-1b9c725b9c0d
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** maintainer decisions of 2026-11-16 in a planning dialogue, after classifying the evidence behind every pair on a copy of the production data; the date order of a bank-name proof decided on 2026-11-17 after a review of the production pairs
**Revisit when:** a bank's export starts or stops carrying a counterparty IBAN, or a false automatic pair turns up
**See:** transactions.md#transfers-between-accounts-are-recognised-by-equal-opposite-amounts-named-pairs-first — 1180c5ed-61dd-4500-a22a-668b28887ba7 — as of 2026-11-16

Two transactions on different accounts pair automatically when their amounts are equal with opposite signs in one currency, their dates lie at most 7 days apart, and one of three proofs holds: both are the same raw row of one bank, as Trade Republic books a trade's cash and depot side; a counterparty IBAN is the other account's number; or a counterparty names the other account's bank as a whole word while the booking on that account names no one else and is not dated after the naming booking.
Among proven candidates the closest dates pair first, one to one; the transfer's panel states the proof in one sentence.
Each bank's extraction writes the counterparty IBAN it exports into the normalized cash transaction: Sparkasse's, Deutsche Bank's cash export's, and Trade Republic's field or, before June 2026, an IBAN in its description.

**Reason:** the maintainer wants the user to see at a glance why two transactions match, and fewer matches over false ones, since pairing by hand is easier than finding and undoing a false pair.
On the production copy of 2026-11-16 the proofs kept 538 of 563 pairs (433 by bank name, 62 by one raw row, 43 by IBAN) and made none false; the 25 dropped were the 7 false pairs and 18 real transfers that carry no proof.

**Reason:** a bank name says only "some account at that bank", so the other side must name no one else; this paired 3 bank debits with their PayPal funding instead of a shop's refund closer in date.

**Reason:** a bank collects for PayPal or Trade Republic, and credits a withdrawal from them, only after their own booking; closest dates first had paired a 3,20 debit with a PayPal funding two days after it, which left one fare of a series of seven without a partner, and crossed two 15,00 debits with their PayPal payments, the only two bank ↔ PayPal pairs in the wrong order in production.

**Rejected alternative:** a maximum matching of all proven pairs, which pairs the stranded fare but leaves the crossed pair and is harder to explain.

**Rejected alternative:** a holder name per account, so that a booking naming the holder of the other account counts as a proof, which would pair ING Cash ↔ ING Savings, where ING exports no IBAN and both bookings name the user.

**Rejected alternative:** two accounts at one bank pairing on amount and date alone, a weaker proof that pairs any equal amounts on two ING accounts within 7 days.

**Rejected alternative:** the pairing of equal amounts within 7 days without a proof, with pairs naming the other bank first, which made 10 false pairs on the production copy; and preferring, among named pairs, the side without a counterparty, which changed 12 of 123 pairs between the other accounts.

**Rejected alternative:** reading the counterparty IBAN from the raw data when pairing, which puts each bank's columns outside its folder.

**Consequence:** every ING Cash ↔ ING Savings transfer, and Trade Republic payouts from before June 2026, are pinned by hand.

**Consequence:** stored rows got their counterparty IBAN by a one-time re-extraction, because `sync` never changes a stored row.

## The user corrects a transfer by pinning or marking a transaction

**Id:** 4da57192-6d83-425b-870c-7d7a6bade529
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** maintainer decisions of 2026-11-16 in a planning dialogue; the agent's table design, confirmed with the plan
**See:** transactions.md#a-transfer-pairs-automatically-only-on-a-proof-the-banks-wrote — ad8336e6-fda9-4e3e-9470-1b9c725b9c0d — as of 2026-11-16

The user pins two transactions together as a transfer, or marks a transaction as no transfer; both take precedence over the automatic pairing and hold through every sync and upload, and releasing a correction hands the transactions back to it.
A pin joins opposite equal amounts in one currency on two accounts, any number of days apart; marking an automatic transfer as no transfer marks both sides.
A correction is a row in `transfer_corrections`, with a partner for a pin and none for no transfer; a deferred check refuses a pin that is not mutual or not of opposite equal amounts on two accounts, and deleting either transaction deletes the pin.

**Reason:** the maintainer wants every transfer right and the user, not more automatic rules, to settle what no proof shows; a mark on one transaction ends a wrong pair at once, and pinning the right partner frees a wrongly paired one by itself.

**Reason:** a trigger keeps every raw transaction as the bank delivered it, so the user's corrections live in a table of their own.

**Rejected alternative:** corrections on a pair ("not this pair"), which leave both transactions free to pair wrongly again.

**Rejected alternative:** pins of any two amounts, such as 100,00 sent and 98,50 received after a fee, which needs both amounts in the transfer's row and leaves the difference uncounted.

**Rejected alternative:** two columns on `transactions`, which the trigger keeping raw transactions unchanged would refuse to update.

## Unpaired transactions that look like part of a transfer are marked

**Id:** 07371f0e-6503-4e45-9f6e-b7e645c1a2c8
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** maintainer decisions of 2026-11-16 in a planning dialogue, with counts from the production copy
**See:** transactions.md#a-transfer-pairs-automatically-only-on-a-proof-the-banks-wrote — ad8336e6-fda9-4e3e-9470-1b9c725b9c0d — as of 2026-11-16

An unpaired transaction not marked as no transfer is marked "probably a transfer" when another account holds an unpaired, unmarked opposite amount in one currency within 7 days, which it then suggests, closest first, or when its counterparty names another account's bank or carries another account's IBAN while no partner fits.

**Reason:** the maintainer wants a mark where a transaction might belong to a transfer but was not paired, and none on automatic pairs, which pair only on a proof; on the production copy of 2026-11-16 the marks cover every real transfer left unpaired: 55 marks, of which 38 point at a real transfer to pin, 1 at a transfer whose partner lies before the recorded history, and 16 are false alarms such as a friend's payment beside a card payment of the same amount.

**Rejected alternative:** marking only transactions with a proof but no partner, which leaves ING Cash ↔ ING Savings transfers unmarked; marking only opposite amounts, which leaves out a booking naming one of the user's banks whose partner lies more than 7 days away.

**Rejected alternative:** marking doubtful automatic pairs for review, which the proofs make unnecessary.

**Consequence:** marking a false alarm as no transfer also clears the mark of a partner that had no other candidate.

