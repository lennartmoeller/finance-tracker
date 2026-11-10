# Deutsche Bank depot through its JSON transactions

The Deutsche Bank adapter reads the depot from the web app's JSON transactions, because the web app builds the depot's CSV export in the page from those same transactions, for the filter's period only, so the CSV carries a subset of their fields, unlike the giro account's server-side export in [ADR 0006](./0006-deutsche-bank-through-its-csv-transaction-export.md).
Its raw transactions follow the JSON's shape as their own source, which has no transaction ID, so their identity is a hash of the whole transaction with an occurrence counter, and moving to the CSV later would import every transaction again under new identities.

## Considered options

- The CSV the web app builds for the depot, which the Wealthfolio companion parses, and which would mean rebuilding the page's own conversion in the adapter, with fewer fields and German number formats.
