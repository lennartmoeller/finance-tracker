# Trade Republic through its CSV transaction export

The Trade Republic adapter reads the web app's CSV transaction export, because one request returns the cash account's and the depot's whole history with ISIN, shares, price, fee, tax and counterparty IBAN as columns and a UUID per row.
Its raw transactions follow the export's shape and take that UUID as their identity, and the WebSocket timeline's event IDs differ from it, so moving to the timeline later would import every transaction again under new identities.

## Considered options

- The WebSocket timeline that a proof of concept and the unofficial client pytr read, which reaches the same history but carries counterparty IBAN, shares, price and fee only in one detail request per event, as display text in the session's language.

## Consequences

- The export has no status column, so it counts as booked transactions only; a pending row seen later needs a filter or a new shape version.
