# Security prices from onvista

The backend stores the price of each security for every LS Exchange trading day of its holding spans, read by ISIN from onvista's undocumented API without a key, so that a depot can be valued on any day it held the security.
A price is the security's close on LS Exchange in EUR, because that market covers every trading day of every security the user held, closes latest, at 23:00, and is where Trade Republic, which held most of them, trades.
The `price.fill` procedure fills the finished days each holding span lacks and never rewrites a stored price, so the stored history outlives a change to onvista's API; the user calls it by hand until a Kubernetes CronJob calls it once a day.

## Considered options

- Yahoo Finance, whose ISIN search found a Xetra symbol for 3 of the 8 held securities, leaving the rest to symbols mapped by hand, and whose throttling rejected a browser-like User-Agent.
- A provider with an API key, such as Twelve Data, Marketstack or EODHD, whose free plans reach none of the EUR listings or keep a year of history at most.
- Xetra's close, which comes at 17:30 and lacked a day for three held securities.
- Each bank's own market, which needs a market column and two prices a day for a security held at two banks.
- A row for every calendar day, which stores copies that are no market price.
- Filling when the prices are read, or on a timer in the backend, which makes a read call onvista or gives the backend a scheduler.

## Consequences

- onvista adjusts past prices for a later corporate action and offers no unadjusted series, so a backfill stores them adjusted: Continental's 2024 prices are about a quarter below what the user paid, because of the Aumovio spin-off in 2025.
- A security that LS Exchange does not list in EUR gets no prices, and the fill fails naming it after storing every other security's prices.
- Prices are as fresh as the last fill, so a depot's market value shows the date of the oldest price it uses.
- One module holds every detail of onvista's API, so a change there touches that module alone.
- A stock split within a holding span stays unhandled until a depot transaction type models one.
