# Figures

## Gain percent of what the purchases cost

**Id:** f5b4dee7-9d67-4ac8-99ca-caa733c70afc
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** maintainer decision in a design review, 2026-11-11

The frontend shows each gain with its percent of what the purchases cost, fees included: the sum of the amounts of the trades that bought shares, for a depot, a security or all securities, on the Overview and the Securities view alike.

**Reason:** invested money, the obvious base, turns negative once sales paid out more than purchases cost, so a security sold at a profit showed a negative percent and a security sold in full had no meaningful one; what the purchases cost is never negative and exists for every security, held or sold.

**Rejected alternative:** invested money as the base, as the Overview first had it, which flips the percent's sign after a profitable sale.

**Rejected alternative:** an annual money-weighted rate (XIRR), which weighs when each euro went in but needs an iterative solver and swings to extreme values for a security held a few weeks.

**Consequence:** the percent ignores timing, so a savings plan's purchase last month counts like one from two years ago.

## Distributions split into paid out and reinvested

**Id:** 674fc57f-f532-41bd-95a8-4e02a071c742
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** maintainer decision in a design review, 2026-11-11
**See:** transactions.md#depot-amounts-as-invested-money — 61823f39-7074-47f5-b70c-e7b5e94916bc — as of 2026-11-11

The Securities view shows a scope's distributions as two figures: the reinvested ones, valued as each reinvestment's shares times the security's LS Exchange close on its day, and the paid-out ones, the rest of the distributions, floored at 0.
No figure adds distributions to the gain.

**Reason:** finvesto delivers each reinvested distribution twice, as a distribution with its amount and days later as a reinvestment whose shares raise the market value and so the gain, and nothing in the data links the two; the split shows the money that left the depot apart from the money already inside the gain, without guessing which distribution a reinvestment came from.
Valued at the exchange's close rather than at what finvesto paid, a reinvestment's shares can exceed their distribution by cents, so paid out is floored at 0 instead of turning slightly negative for a fund that reinvests everything.

**Rejected alternative:** one Distributions figure, which hides that part of it is already inside the gain.

**Rejected alternative:** matching each reinvestment to the distribution before it, which rests on a link the data does not hold.

**Rejected alternative:** a total gain of gain plus every distribution, which counts each reinvested distribution twice.

**Consequence:** the reinvested and paid-out figures differ from the delivered amounts by a few cents, 4 cents over finvesto's 7 reinvestments in 2026-11.

## Securities' figures add up in the frontend

**Id:** 8e0571e3-dd23-4eee-87bb-f428b33c27b8
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** maintainer decision in a design review, 2026-11-11
**Revisit when:** the depots hold so many securities or years of prices that the Securities view's daily series takes noticeably long
**See:** apps.md#the-frontend-shows-normalized-data-only — 9bceafdf-ab29-4139-a915-cdaf46ed196c — as of 2026-11-11

The frontend computes each security's figures and the daily market value and invested money behind the Securities view's chart from `transaction.list` and `price.list`, which it loads anyway, so the API serves no figures.

**Reason:** the frontend already computed each depot's figures this way, and the data is small, 8 securities and about 1,750 prices in 2026-11, so the daily series over all of them takes about 14 ms in the browser.

**Rejected alternative:** a backend procedure serving figures or series per security, which adds API surface for figures the browser already has the inputs for.

**Consequence:** the series recomputes a position only on days with a transaction, and the chart redraws after the rest of the view, because Recharts needs about 150 ms in the dev server for some 850 daily points.
