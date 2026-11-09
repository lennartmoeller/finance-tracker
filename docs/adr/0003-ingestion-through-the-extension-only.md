# Ingestion through the extension only

Every account takes the Firefox extension and the system drops Enable Banking, because the user wants all the data a bank offers, and the bank's website offers more than its PSD2 interface for every account but one.
This supersedes [ADR 0002](./0002-ingestion-through-enable-banking-and-the-extension.md), whose Enable Banking sign-up and measurements on 2026-11-09 ([#4](https://github.com/lennartmoeller/finance-tracker/issues/4)) produced the comparison below.

## Richer route per account

| Account | Only through Enable Banking | Only through the website |
| --- | --- | --- |
| ING giro account | transaction ID, transaction date, counterparty IBAN on 5% of debits | running balance |
| ING savings account | nothing, because ING does not offer it for linking | every transaction |
| Deutsche Bank giro account | transaction ID, ISO 20022 transaction codes | BIC, mandate reference, creditor ID, foreign fees, ultimate party |
| PayPal giro account | nothing known | item titles, fees, euro amounts of currency conversions, history older than a year |

- More fields count for more than the bank's transaction ID, because identity falls back to a hash of stable fields where a source has no ID ([architecture](../architecture.md#raw-data-and-shape-versions)).
- The ING giro account alone is richer through Enable Banking, but the extension needs an ING adapter for the savings account anyway, and that adapter reads the giro account in the same session.
- Depots and the Trade Republic and finvesto accounts already took the extension, because no PSD2 interface reaches them.
- FinTS, unofficial clients and other data services stay out, for the reasons in ADR 0002.

## Considered options

- Enable Banking for the ING giro account alone, which would keep a backend client, a consent flow, an HTTPS callback with a trusted certificate, a private key and 180-day renewals for one account's transaction ID and transaction date.
- The bank's transaction ID beating extra fields, which would have kept the Deutsche Bank giro account on Enable Banking.
