# Context index

Why the finance tracker is built the way it is, in the [Keep the Why](https://keepthewhy.com) format.

## 0

## 1

## 2

## 3

## 4

## 5

## 6

## 7

## 8

## 9

## A

- [accounts.md](accounts.md) — why an account's figures and sync freshness live in the Accounts view without its transactions, why closing an account is a flag that takes it out of syncing, why deleting one takes typing its name, and why its upload opens a side panel
- [apps.md](apps.md) — why the system is one backend, one frontend and a browser extension, what the frontend shows, how it draws charts, how the Transactions view filters, sums and renders its rows and shows a transfer as one row, and why every screen has an address that the Navigation API follows

## B

- [banks.md](banks.md) — why every bank is one folder that the apps discover, why it declares only the account types the extension syncs, and when a shape version may widen

## C

- [contract.md](contract.md) — why `docs/contract/` is an overview whose rules live in the code, why it is split by topic, and why terms live in the code without a glossary

## D

- [database.md](database.md) — why the schema is one SQL file without an ORM, and how pgschema brings the database to it

## E

## F

- [figures.md](figures.md) — how the frontend's balances, gains and distributions count, why the frontend computes them, and why the start balance keeps its meaning when the frontend sets it

## G

## H

- [hosting.md](hosting.md) — why the finance tracker ships as a Helm chart with its own PostgreSQL, how nginx, the migrate step and the network policy guard it, how every merge releases, and how the extension finds and updates itself

## I

- [ingestion.md](ingestion.md) — why every account but Sparkasse is read by the browser extension, which export each adapter reads, how raw transactions are read, how the legacy Sparkasse and ING history entered, why uploads read a bank's export as the extension does, and how a Trade Republic IPO subscription books

## J

## K

## L

- [layout.md](layout.md) — why all implementation lives in `src/`, one folder per package, all shared code in `src/shared/`, and the chart at the root

## M

## N

## O

## P

- [prices.md](prices.md) — where security prices come from, and how and when they are filled

## Q

## R

- [rules.md](rules.md) — why brands and categories follow from rules matched in PostgreSQL, why the frontend reads the same patterns through a translation, how patterns are written, which rule wins, how categories nest, how rules are saved and deleted, what a brand's, category's or rule's transactions link lists, and why rules count no transfer

## S

## T

- [transactions.md](transactions.md) — how depot amounts count, how normalized transactions are stored and checked, and how transfers between accounts are recognised

## U

## V

## W

## X

## Y

## Z
