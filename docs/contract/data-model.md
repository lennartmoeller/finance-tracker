# Data model

```mermaid
erDiagram
  accounts ||--o{ transactions : "holds"
  transactions ||--o| cash_transactions : "extracts to"
  transactions ||--o| depot_transactions : "extracts to"
  securities ||--o{ depot_transactions : "appears in"
  securities ||--o{ prices : "priced by"
  securities |o--o| logos : "pictured by ISIN"
  brands |o--o| logos : "pictured by domain"
  brands |o--o{ rules : "owns"
  categories |o--o{ rules : "owns"
  categories |o--o{ categories : "parent of"
  brands |o--o{ rules : "required by"
  rules |o..o{ cash_transactions : "assign a brand and a category by matching"

  accounts {
    integer id PK
    text name "unique per bank"
    text bank
    text type "cash or depot"
    text number "unique per bank"
    timestamptz last_synced_at "optional"
    numeric start_balance "optional: a cash account's balance before its first stored transaction"
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
    integer id PK
    text name "unique"
    text domain "unique"
  }
  categories {
    integer id PK
    integer parent_id FK "optional"
    text name "unique per parent"
  }
  rules {
    integer id PK "creation order"
    integer brand_id FK "optional: the owning brand, or"
    integer category_id FK "optional: the owning category"
    integer required_brand_id FK "optional, on a category's rule only"
    text counterparty_pattern "optional"
    text description_pattern "optional"
  }
  logos {
    integer id PK
    text domain FK "optional, unique, instead of an isin"
    text isin FK "optional, unique, instead of a domain"
    bytea image "optional: a 256-pixel PNG"
  }
```

Every column is required unless the diagram marks it optional.
A dotted line has no foreign key: the backend matches the rows when it reads them.
The [schema](../../src/backend/schema.sql) holds the constraints and triggers, and the migrate step brings the database to it before the backend starts, as [Hosting](./hosting.md) shows.
