# Figures

```mermaid
flowchart LR
  accounts["account.list"]
  transactions["transaction.list"]
  prices["price.list"]
  settings["settings.get"]
  subgraph frontend["Frontend"]
    accountsView["Accounts<br/>each account and all together:<br/>a cash account's balance from its start balance and amounts,<br/>a depot's invested money, market value, gain and distributions,<br/>the total of the balances and market values,<br/>split into cash and depots, and the depots into invested money and gain,<br/>and every day's balance, market value and invested money, or total"]
    securities["Securities<br/>each security held or sold, and all together:<br/>invested money, market value, gain and distributions,<br/>each held security's share of the market value,<br/>and every day's market value and invested money"]
    list["Transactions<br/>the normalized transactions<br/>of one account or all of a type,<br/>a transfer in one row when both its sides are listed"]
  end
  accounts --> accountsView
  accounts --> list
  settings -- "the day transactions begin" --> accountsView & securities & list
  transactions --> accountsView
  transactions --> securities
  transactions --> list
  prices -- "latest price on or before each day" --> accountsView & securities
```

The frontend adds up every figure in the browser from these lists, so the API serves no figures.
Where the settings name a day transactions begin, the Transactions view lists only transactions from that day on, and every chart begins on it with the values carried over from before, while every other figure counts every transaction.
