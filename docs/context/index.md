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

- [apps.md](apps.md) — why the system is one backend, one frontend and a browser extension, what the frontend shows, and how it draws charts

## B

- [banks.md](banks.md) — why every bank is one folder that the apps discover, and why it declares only the account types the extension syncs

## C

- [contract.md](contract.md) — why `docs/contract/` is an overview whose rules live in the code, why it is split by topic, and why terms live in the code without a glossary

## D

- [database.md](database.md) — why the schema is one SQL file without an ORM, and how pgschema brings the database to it

## E

## F

- [figures.md](figures.md) — how the frontend's balances, gains and distributions count, and why the frontend computes them

## G

## H

- [hosting.md](hosting.md) — why the finance tracker ships as a Helm chart with its own PostgreSQL, how nginx, the migrate step and the network policy guard it, how every merge releases, and how the extension finds and updates itself

## I

- [ingestion.md](ingestion.md) — why every account but Sparkasse is read by the browser extension, which export each adapter reads, how raw transactions are read, and how the legacy Sparkasse and ING history entered

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

- [rules.md](rules.md) — why brands and categories follow from rules matched in PostgreSQL, which rule wins, how categories nest, and how rules are saved and deleted

## S

## T

- [transactions.md](transactions.md) — how depot amounts count and how normalized transactions are stored and checked

## U

## V

## W

## X

## Y

## Z
