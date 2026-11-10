# Raw transactions read by their account

A raw transaction is read by its account's bank and account type and by its shape version, and no transaction stores a source, because an account's bank and type never change and already decide which export its transactions come from.
Shape versions count per bank and account type: a format change within an export and a switch to another export each add one, so moving the Deutsche Bank depot to its CSV export makes it Deutsche Bank depot shape version 2.
This amends [ADR 0007](./0007-deutsche-bank-depot-through-its-json-transactions.md) and [ADR 0008](./0008-finvesto-depot-through-its-csv-transaction-export.md), which name their exports as sources.

## Considered options

- A source stored with every raw transaction, which repeats what the account says and let one account type's sync be stored on another account of the same bank.
- Bank and account type in the sync input, which would let the contract validate the raw transactions and the compiler pair each adapter with it, but repeat what the account says, so the backend validates after loading the account instead.

## Consequences

- Account types sharing an export, such as ING's giro and savings accounts, each count its shape versions, so a change to it adds a version to each, and a type that joins it later starts at its own version 1.
- Only the API keeps an account's bank and type unchanged, so changing either in the database would misread the account's raw transactions.
