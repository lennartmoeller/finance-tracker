# Consumers read raw transactions

The backend's API serves each transaction's raw data beside its normalized transaction, because the first consumer, the transaction viewer, exists to let the user check extraction against what the bank delivered.
This amends [ADR 0005](./0005-bank-data-service-with-the-extension-as-its-interface.md), whose consumers read only normalized transactions; the extension stays the service's only interface.

## Considered options

- The viewer as a second, read-only interface of the bank data service, which would keep raw data inside the service but end the extension's place as its only interface.
- Normalized transactions only, checked against the bank websites by eye, which leaves an extraction bug hard to trace to its cause.

## Consequences

- A consumer can come to depend on a source's raw shape, which changes with every new shape version, so finance logic should build on normalized transactions alone.
