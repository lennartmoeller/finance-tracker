# Data model

```mermaid
erDiagram
  accounts ||--o{ transactions : "holds"
  transactions ||--o| cash_transactions : "extracts to"
  transactions ||--o| depot_transactions : "extracts to"
  securities ||--o{ depot_transactions : "appears in"
  securities ||--o{ prices : "priced by"
  securities |o--o| logos : "pictured by ISIN"
  brands |o..o| logos : "pictured by domain"
  brands |o..o{ cash_transactions : "matches by pattern"

  accounts {
    integer id PK
    text name "unique per bank"
    text bank
    text type "cash or depot"
    text number "unique per bank"
    timestamptz last_synced_at "optional"
  }
  transactions {
    integer id PK
    integer account_id FK
    integer shape_version
    text identity "unique per account"
    jsonb data "the raw transaction"
  }
  cash_transactions {
    integer transaction_id PK, FK
    date date
    numeric amount
    text currency
    text counterparty "optional"
    text description "optional"
  }
  depot_transactions {
    integer transaction_id PK, FK
    date date
    text isin FK
    text type "trade, reinvestment, fee, tax or distribution"
    numeric quantity "optional, by type"
    numeric amount "optional, by type"
    text currency "optional, with amount"
    text description "optional"
  }
  securities {
    text isin PK
    text name
    text named_by "the bank whose name it holds"
  }
  prices {
    text isin PK, FK
    date date PK "a trading day"
    numeric price "in EUR"
  }
  brands {
    integer id PK "creation order"
    text name "unique"
    text pattern
    text domain "unique"
  }
  logos {
    integer id PK
    text domain "optional, unique, instead of an isin"
    text isin FK "optional, unique, instead of a domain"
    bytea image "optional: a 256-pixel PNG"
  }
```

Every column is required unless the diagram marks it optional.
A dotted line has no foreign key: the backend matches the rows when it reads them.
The [schema](../../src/backend/schema.sql) holds the constraints and triggers.
