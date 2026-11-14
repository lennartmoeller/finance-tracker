# API

The backend serves oRPC procedures under `/rpc`, which [`contract.ts`](../../src/shared/contract.ts) defines with their input and output schemas.

| Procedure | Caller | Does |
| --- | --- | --- |
| `account.create` | Browser extension, frontend | Creates an account from its name, bank, type and number |
| `account.list` | Browser extension, frontend | Lists every account with its last sync, start balance and closed mark |
| `account.update` | Browser extension, frontend | Changes an account's name, start balance and closed mark |
| `account.remove` | Browser extension, frontend | Removes an account with its transactions |
| `sync` | Browser extension | Ingests an account's raw transactions, as [Ingestion](./ingestion.md) shows |
| `transaction.list` | Frontend | Fetches the missing logos, then lists every normalized transaction, newest first, with its security's name and logo path, and the brand and category its [rules](./rules.md) assign |
| `brand.list` | Frontend | Fetches the missing logos, then lists every brand with its domain, logo path and rules, as [Logos](./logos.md) shows |
| `brand.create` | Frontend | Creates a brand from its name and domain, with its rules |
| `brand.update` | Frontend | Changes a brand's name, domain and rules |
| `brand.remove` | Frontend | Removes a brand with its rules and logo |
| `category.list` | Frontend | Lists every category with its parent and rules |
| `category.create` | Frontend | Creates a category from its name and parent, with its rules |
| `category.update` | Frontend | Changes a category's name, parent and rules |
| `category.remove` | Frontend | Removes a category with its rules |
| `price.fill` | The cluster's daily CronJob, or the user by hand | Fills the prices the holding spans lack, as [Prices](./prices.md) shows |
| `price.list` | Frontend | Lists every stored price |

Beside the procedures, `GET /logos/<id>` serves a stored logo, as [Logos](./logos.md) shows.
