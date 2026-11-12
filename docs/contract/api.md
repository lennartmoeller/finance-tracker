# API

The backend serves oRPC procedures under `/rpc`, which [`contract.ts`](../../shared/contract.ts) defines with their input and output schemas.

| Procedure | Caller | Does |
| --- | --- | --- |
| `account.create` | Browser extension | Creates an account from its name, bank, type and number |
| `account.list` | Browser extension, frontend | Lists every account with its last sync |
| `account.rename` | Browser extension | Renames an account |
| `account.remove` | Browser extension | Removes an account with its transactions |
| `sync` | Browser extension | Ingests an account's raw transactions, as [Ingestion](./ingestion.md) shows |
| `transaction.list` | Frontend | Fetches the missing logos, then lists every normalized transaction, newest first, with the name and logo path of its brand or security, as [Logos](./logos.md) shows |
| `price.fill` | The user, by hand | Fills the prices the holding spans lack, as [Prices](./prices.md) shows |
| `price.list` | Frontend | Lists every stored price |

Beside the procedures, `GET /logos/<id>` serves a stored logo, as [Logos](./logos.md) shows.
