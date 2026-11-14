# Accounts

## The Accounts view is the one home of an account's figures

**Id:** 1236e03f-6801-4051-8e11-c0c26a6a5628
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** maintainer decisions in a planning dialogue, 2026-11-13, the view's mockup rounds, 2026-11-14, and the maintainer's review with the production data, 2026-11-14
**See:** apps.md#one-backend-one-frontend-and-a-browser-extension — 4117e375-a931-49b6-90b5-79fa89e99080 — as of 2026-11-14

The frontend's Accounts view lists all accounts in one table, valuing a cash account by its balance and a depot by its market value, below the total of all accounts and its value over time, which a selected row narrows to that account's figures and chart; it creates, edits and deletes accounts in a side panel.
The Overview stays empty for now, and the Accounts view lists no transactions: an account links to its chip in the Transactions view instead.

**Reason:** each thing has one home, an account's figures in the Accounts view and its transactions in the Transactions view, and the view reuses the Securities view's way of narrowing figures and chart, which the maintainer already knows.

**Rejected alternative:** an account screen with its figures and its transactions, as issue #40 planned on 2026-11-11, which repeats the Transactions view's list.

**Rejected alternative:** the Overview's cards per account kept, opening the Transactions view or the account's screen.

**Rejected alternative:** each account on a screen of its own, which adds a navigation level and shows no chart of all accounts; and the account's figures with a small chart in a side panel.

**Rejected alternative:** dropping the Transactions view's account chips in favour of the Accounts view.

**Rejected alternative:** a Cash and a Depot tab, each with its type's columns, the view's first version, which the maintainer dropped on seeing it with real data: the table needs only one value per account.

**Consequence:** the Overview, whose total the Accounts view took over, shows nothing until it gets figures of its own.

## A closed account is a flag that takes it out of syncing

**Id:** 8dcdf615-992f-404a-a497-99c69d4320f6
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** maintainer decisions in a planning dialogue, 2026-11-13
**See:** banks.md#a-bank-declares-only-the-account-types-the-extension-syncs — bc02b8d8-1203-472c-970a-f5651ec803a7 — as of 2026-11-14

`accounts.closed` marks an account the user closed at its bank: the popup no longer lists it and the frontend shows no sync freshness for it, the Accounts view greys it out, and every list and total still counts it.

**Reason:** a closed account cannot be synced, so its sync button would only fail and its freshness would stay stale for good, while its history still belongs in every figure.

**Rejected alternative:** a closing date, which no figure or view reads; the agent's choice, approved with the plan.

**Rejected alternative:** a database trigger refusing new transactions on a closed account, one more trigger to maintain and a reopening before every hand import.

**Rejected alternative:** a closed account set apart in the Transactions view's chips or hidden from the Overview.

## Deleting an account takes typing its name

**Id:** 4e321cff-01d7-4433-a4ba-bb96569f4871
**Type:** decision
**Status:** active
**Evidence:** inferred
**Source:** maintainer decision in issue #40's planning, 2026-11-11, kept in a planning dialogue, 2026-11-13

The frontend deletes an account only after the user types its name, as the popup does, while deleting a brand or category takes one confirming click.

**Reason:** inferred, since the maintainer confirmed the decision but stated no reason: deleting an account deletes all its transactions, and a synced history may reach further back than the bank still offers, so it cannot always be synced again, while a rule is cheap to write again.

**Rejected alternative:** the Rules view's one confirming click for accounts too.
