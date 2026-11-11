# The frontend shows normalized data only

The frontend shows the user's money in normalized transactions and the figures that add up from them, and no longer shows raw transactions beside them, so `transaction.list` serves each normalized transaction without its raw transaction and leaves out a raw transaction that extraction turns into none.
Extraction stays checked by each bank's unit tests and the database's rules, and the user inspects a raw transaction in the database when one needs a look.
This amends [ADR 0014](./0014-one-backend-one-frontend-and-a-browser-extension.md), whose frontend showed each raw transaction beside its normalized transaction so the user could check extraction.

## Considered options

- Raw fields in the frontend's transaction detail, or a list of raw transactions without a normalized one, which keeps a checking tool in an interface built to show the user's money and keeps raw data in the API for it.

## Consequences

- A raw transaction that extraction turns into none, such as finvesto's notice of a charge, shows up in no interface.
- A wrong extraction surfaces only as a wrong figure or transaction in the frontend, so its cause is found in the database.
