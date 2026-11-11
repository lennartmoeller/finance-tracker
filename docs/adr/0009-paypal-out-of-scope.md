# PayPal out of scope

The PayPal giro account stays out of the system, because PayPal's website offers its transactions only as activity reports it generates asynchronously, and the user rates the account as not worth what reading them costs.
This takes PayPal out of [ADR 0003](./0003-ingestion-through-the-extension-only.md)'s scope, which had chosen the website over Enable Banking for it.

The exploration on 2026-11-10 found:

- The activity report is a CSV with item titles, fees, a row of its own for each currency conversion's euro amount and a running balance, so its data would carry everything ADR 0003 counted for PayPal.
- Each report covers at most 12 months within the last seven years, took about four minutes to generate, and makes PayPal email the user; the report list holds 12 reports, and older reports lose their files while still listed.
- The activity page is server-rendered HTML without transaction JSON.
- PayPal's login rejects a WebDriver-controlled Firefox, so every adapter check needs a Firefox without WebDriver.

## Considered options

- Reports since the last sync: the first sync requests seven yearly reports and every later sync one report reaching back before the account's last sync, each waiting about four minutes for one email, but breaking the [architecture](../architecture.md#browser-extension-sync)'s rule that a sync reads the full history the bank offers.
- Full history on every sync: seven or eight reports, emails and minutes of waiting per sync, pushing the user's own reports out of the list.
- A two-step sync that requests the reports and imports them on the next sync, at two clicks per sync.
- Scraping the activity page, which lacks the running balance, the balance impact and the related transaction codes.
- Enable Banking, which ADR 0003 dropped and which reached 376 days back on this account.

## Consequences

- PayPal payments reach the system only where a giro account pays PayPal, as PayPal's debits without item titles.
- Reopening fits once PayPal offers a synchronous export or a consumer needs PayPal's own transactions.
