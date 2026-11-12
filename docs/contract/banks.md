# Banks

```mermaid
flowchart LR
  subgraph unit["banks/&lt;bank&gt;/"]
    bank["bank.ts<br/>name, logo,<br/>account types with number formats"]
    adapter["adapter.ts<br/>hosts, permissions, read"]
    extract["extract.ts<br/>security name rank,<br/>an extraction per account type and shape version"]
  end
  interfaces["shared/bank.ts<br/>Bank, BankAdapter, BankExtraction"]
  frontend["Frontend"]
  popup["Extension popup and background"]
  manifest["Extension manifest,<br/>built by wxt.config.ts"]
  backend["Backend"]
  interfaces -. "typed by" .- unit
  bank -- "import.meta.glob: bank logos" --> frontend
  adapter -- "import.meta.glob: banks to add accounts at, sync" --> popup
  adapter -- "banks/discover.ts: hosts and permissions" --> manifest
  extract -- "banks/discover.ts: new account checks,<br/>extraction, security naming" --> backend
```

Every app finds the bank folders by these file names, so a folder added or removed changes what the apps offer without a change to the apps.
A bank's identity rule comes from its extraction, and [`banks/identity.ts`](../../banks/identity.ts) turns it into the identity the backend stores, as [Ingestion](./ingestion.md#adapters) shows.
