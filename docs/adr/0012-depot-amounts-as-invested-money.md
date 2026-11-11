---
status: amended by ADR-0013
---

# Depot amounts as invested money

A depot transaction's amount is the change in the money invested in the depot, seen from the depot, so a purchase adds what it cost, fees included, and a sale subtracts what it paid out.
Invested money changes only when the user moves money between the depot and another account, so income and what is done with it get no amount: a dividend or Trade Republic's stock perk settles on the account it is paid to and counts there, and a reinvested fund distribution never leaves the depot.
A charge paid by selling shares, such as finvesto's fees and Vorabpauschale, gets no amount either, because the sale pays the bank or the tax office and the user takes nothing out; the charge lowers the depot's market value, not the money invested in it.

## Considered options

- The cash each transaction moved, seen from the account that paid, which made a depot add up to minus its purchases plus its income, a figure that means neither.

## Consequences

- Adding up an account's amounts gives its balance, or for a depot its invested money, wherever the bank data service holds the account's whole history.
- A trade appears in the depot and the account that paid with opposite amounts, so it cancels when adding up across accounts, and a purchase paid with income, such as the one following a stock perk, counts like any other.
