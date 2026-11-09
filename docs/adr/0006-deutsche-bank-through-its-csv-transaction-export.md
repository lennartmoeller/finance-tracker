# Deutsche Bank through its CSV transaction export

The Deutsche Bank adapter reads the web app's CSV transaction export, because it carries every field that [ADR 0003](./0003-ingestion-through-the-extension-only.md) counted for the Deutsche Bank giro account, the ultimate party (Abweichender Empfänger) among them.
Its raw transactions follow the export's shape, which has no transaction ID, so their identity is a hash of the whole row with an occurrence counter, and moving to the web app's JSON transactions later would import every transaction again under new identities.

## Considered options

- The web app's JSON transactions, which carry the bank's transaction ID, contrary to ADR 0003's table, together with a transaction type and a timestamp, but no ultimate party, and which need one detail request per transaction for everything beyond counterparty, amount, booking date and purpose.
