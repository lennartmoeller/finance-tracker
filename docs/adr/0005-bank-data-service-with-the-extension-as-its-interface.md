---
status: superseded by ADR-0014
---

# Bank data service with the extension as its interface

Reading, storing and delivering bank data form one service, the bank data service: a backend with its own PostgreSQL, and the Firefox extension, whose popup creates accounts, syncs them and shows each one's last sync.
Consumers, such as future finance logic backends and a frontend, read its normalized transactions only through the backend's API and never its database, so the web frontend goes away and the transaction views it was to hold move to a consumer.
This supersedes [ADR 0001](./0001-separate-web-frontend-and-thin-extension.md), whose costs, a signed release per interface change and one Firefox only, now hit only the account and sync screens, which need that Firefox's bank sessions anyway.

## Considered options

- Opening balances and balances in the bank data service, entered in the popup, which keeps them next to the transaction history they depend on but adds user-entered data and a computation to a service that delivers bank data.

## Consequences

- Opening balances and balances belong to the consumers, and a consumer's opening balance goes wrong when the service's history of that account grows, such as when a new shape version delivers older transactions.
