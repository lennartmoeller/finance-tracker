# finvesto depot through its CSV transaction export

The finvesto adapter reads the depot from the portal's CSV transaction export, because one request returns the depot's whole history with every field the portal holds for a transaction, fees, taxes, cash distributions and the Vorabpauschale among them.
finvesto is a brand of FNZ Bank SE, whose portal at `portal.fnz.de` serves the export.
Its raw transactions follow the export's shape and take its Ref. Nr., the bank's unique reference, as their identity, so moving to the portal's JSON transactions later would import every transaction again under new identities.

## Considered options

- The portal's JSON transaction overview, which carries ISO dates, dot decimals and the bank's transaction ID, but is paged and lacks fees, taxes and distribution amounts, leaving some transactions without any amount.
- The Online-Postkorb's PDF statements, which would need text extraction from documents made for reading.

## Consequences

- The export answers for the cash account with the same header and no rows, so the cash account can share the source "finvesto" once it has transactions.
