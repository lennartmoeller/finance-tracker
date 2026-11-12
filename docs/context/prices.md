# Prices

## Security prices from onvista

**Id:** 35b1e0be-7456-4bbb-8dfd-f1cf70621ac5
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** ADR 0015, removed from docs/adr/ (see git history)
**Revisit when:** a held security splits its shares within a holding span

The backend stores the price of each security for every LS Exchange trading day of its holding spans, read by ISIN from onvista's undocumented API without a key, so that a depot can be valued on any day it held the security.
A price is the security's close on LS Exchange in EUR.
The `price.fill` procedure fills the finished days each holding span lacks and never rewrites a stored price; a CronJob calls it once a day in the cluster, and the user calls it by hand with Compose.

**Reason:** LS Exchange covers every trading day of every security the user held, closes latest, at 23:00, and is where Trade Republic, which held most of them, trades.
Never rewriting a stored price lets the stored history outlive a change to onvista's API.

**Rejected alternative:** Yahoo Finance, whose ISIN search found a Xetra symbol for fewer than half of the held securities, leaving the rest to symbols mapped by hand, and whose throttling rejected a browser-like User-Agent.

**Rejected alternative:** a provider with an API key, such as Twelve Data, Marketstack or EODHD, whose free plans reach none of the EUR listings or keep a year of history at most.

**Rejected alternative:** Xetra's close, which comes at 17:30 and lacked a day for three held securities.

**Rejected alternative:** each bank's own market, which needs a market column and two prices a day for a security held at two banks.

**Rejected alternative:** a row for every calendar day, which stores copies that are no market price.

**Rejected alternative:** filling when the prices are read, or on a timer in the backend, which makes a read call onvista or gives the backend a scheduler.

**Consequence:** onvista adjusts past prices for a later corporate action and offers no unadjusted series, so a backfill stores them adjusted, and a price from before a spin-off can sit well below what the user paid.

**Consequence:** a security that LS Exchange does not list in EUR gets no prices, and the fill fails naming it after storing every other security's prices.

**Consequence:** prices are as fresh as the last fill, so a depot's market value shows the date of the oldest price it uses.

**Consequence:** a stock split within a holding span stays unhandled until a depot transaction type models one.

## A CronJob fills the prices at 01:00 Berlin time

**Id:** 61ba5112-9c1e-48b4-9e12-3e91c6041496
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** the coding agent's proposal, confirmed by the maintainer with the plan on 2026-11-12
**See:** prices.md#security-prices-from-onvista — 35b1e0be-7456-4bbb-8dfd-f1cf70621ac5 — as of 2026-11-12

The chart's CronJob `price-fill` calls `price.fill` daily at 01:00 Europe/Berlin, never twice at once, from the backend's image, whose BusyBox `wget` posts the call with the API token to the backend inside the cluster.

**Reason:** LS Exchange closes at 23:00 and the fill stores finished days up to yesterday, so 01:00 fills the day that just ended.

**Reason:** the backend's image already carries an HTTP client, so no further image is pinned.

**Rejected alternative:** an image of its own with an HTTP client such as curl, one more image to pin and bump.
