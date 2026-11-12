# Ingestion

## Sync

```mermaid
sequenceDiagram
  actor User
  participant Ext as Browser extension
  participant Bank as Bank website
  participant BE as Backend
  User->>Bank: Log in, in any tab
  User->>Ext: Sync an account in the popup
  Ext->>Bank: Read every booked transaction the bank offers, in an inactive tab
  alt not logged in
    Ext->>User: Open the bank's login page
  else no shape version matches
    Ext->>User: Report the shape mismatch and send nothing
  else a shape version matches
    Ext->>BE: sync the raw transactions with their shape version
    BE->>BE: Store each raw transaction with a new identity, and the normalized transaction extracted from it
    BE-->>Ext: Imported and skipped counts
    Ext->>User: Show the result
  end
```

A sync leaves the overlap with earlier syncs to the identities already stored, so the browser extension keeps no state between syncs.

## Adapters

Each bank is a folder in [`banks/`](../../banks/), as [Banks](./banks.md) shows, with its adapter, its extraction and its shape versions, one for each structure in which it has delivered an account type's raw transactions.
An adapter reads the account in an inactive tab within the user's session, and sends every row or object its bank delivers as one raw transaction.
Where a diagram calls a bank's API, the adapter calls it from within the bank's page, so that the session authenticates the call.

### ING

```mermaid
sequenceDiagram
  participant A as Adapter
  participant W as ING website
  A->>W: Open the accounts overview
  A->>W: Open the transaction list of the account's IBAN
  A->>W: Set the date filter 15 years back
  W-->>A: The filter, clamped to the 390 days ING keeps online
  A->>W: Export as CSV through the export dialog
  W-->>A: Semicolon CSV in Windows-1252, caught before it reaches the downloads
  Note over A: Identity: a hash of the row without its balance
```

### Trade Republic

```mermaid
sequenceDiagram
  participant A as Adapter
  participant API as Trade Republic API
  A->>API: Request the transaction export since 2000
  A->>API: Check that the session holds the account's IBAN or depot number
  loop until the export is ready, for 20 seconds at most
    A->>API: Ask for the export's status
  end
  A->>API: Download the export
  API-->>A: Quoted comma CSV of the cash account and the depot together
  Note over A: A depot keeps the rows with an ISIN<br/>Identity: transaction_id
```

### Deutsche Bank

```mermaid
sequenceDiagram
  participant A as Adapter
  participant W as Deutsche Bank web app
  participant API as Deutsche Bank API
  A->>W: Open the web app
  W->>API: Request the financial overview
  A->>A: Take the token and API key of that request
  A->>API: Find the account by its IBAN or depot number in the financial overview
  alt cash account
    loop each year since the account opened
      A->>API: Request the year's CSV export and wait until it is finished
      API-->>A: Semicolon CSV in German
    end
  else depot
    A->>API: Read the depot's transactions since 2000
    API-->>A: JSON with one object per transaction
  end
  Note over A: Identity: a hash of the row or object
```

### finvesto

```mermaid
sequenceDiagram
  participant A as Adapter
  participant API as finvesto portal API
  A->>A: Take the session keys from the open portal tabs
  A->>API: Open the portal with the first key still logged in
  A->>API: Find the depot by its number in the depot overview
  A->>API: Request the CSV export since 2000, cancellations included
  API-->>A: Semicolon CSV in Windows-1252
  Note over A: Identity: Ref. Nr.
```
