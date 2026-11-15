# Apps

## One backend, one frontend and a browser extension

**Id:** 4117e375-a931-49b6-90b5-79fa89e99080
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** ADR 0014, removed from docs/adr/ (see git history), which superseded ADRs 0001, 0005 and 0010

The finance tracker is one system of three apps in one repository, built and extended together: the backend with its PostgreSQL, the frontend and the browser extension.
The backend stores whatever the system needs, user-entered data such as opening balances included, and its API serves the frontend and the browser extension alone, so it changes together with them, without versioning or compatibility promises.
The frontend is where the user manages everything, accounts included, while the browser extension keeps creating, renaming, removing and syncing accounts, because syncing needs the bank sessions of the Firefox it runs in.

**Reason:** a web frontend works from any device and deploys as a container, while an extension ships every interface change as a signed release that works only in the Firefox it is installed in.

**Rejected alternative:** the extension as the whole user interface, which ships every interface change as a signed extension release and works only in one Firefox.

**Rejected alternative:** a bank data service of backend and extension with consumers of its own that read its API, which kept user-entered data and finance logic out of the backend and made every feature that needs them wait for a consumer service with a backend of its own.

**Rejected alternative:** the frontend as a viewer of the transactions only, with the popup as the one place to manage accounts.

**Rejected alternative:** the popup shrinking to syncing once the frontend manages accounts.

**Rejected alternative:** a frontend that starts extension syncs, which needs a content-script relay because Firefox lacks `externally_connectable`, and gains nothing while the user must have the bank tab open anyway.

**Consequence:** account management exists in both the frontend and the browser extension, so the logic both need lives in `src/shared/`.

**Consequence:** finance logic builds on normalized transactions alone, because a raw transaction's shape changes with every new shape version.

**Consequence:** a mobile app, if one comes, joins as a fourth app of this repository on the same backend and shared package, and nothing is built for it before then.

## The frontend shows normalized data only

**Id:** 9bceafdf-ab29-4139-a915-cdaf46ed196c
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** ADR 0016, removed from docs/adr/ (see git history)
**See:** apps.md#one-backend-one-frontend-and-a-browser-extension — 4117e375-a931-49b6-90b5-79fa89e99080 — as of 2026-11-11

The frontend shows the user's money in normalized transactions and the figures that add up from them, and no raw transaction, so `transaction.list` serves each normalized transaction without its raw transaction and leaves out a raw transaction that extraction turns into none.

**Reason:** extraction stays checked by each bank's unit tests and the database's rules, and the user inspects a raw transaction in the database when one needs a look, so the frontend stays an interface built to show the user's money.

**Rejected alternative:** raw fields in the frontend's transaction detail, or a list of raw transactions without a normalized one, which keeps a checking tool in that interface and raw data in the API for it.

**Consequence:** a raw transaction that extraction turns into none, such as finvesto's notice of a charge, shows up in no interface.

**Consequence:** a wrong extraction surfaces only as a wrong figure or transaction in the frontend, so its cause is found in the database.

## Charts drawn with Recharts

**Id:** faad392b-071e-4510-9b99-37d8531f6e8e
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** maintainer decision in a design review, 2026-11-11

The frontend draws its charts with Recharts, coloured by the colour tokens in its stylesheet.

**Reason:** an established React chart library turns a chart into a few dozen lines of JSX, and its strokes and fills take CSS variables, so light and dark need no code of their own.

**Rejected alternative:** hand-written SVG charts, about 150 lines of scales, ticks and hover handling per chart with tests of their own, custom infrastructure for a solved problem.

**Consequence:** Recharts stacks its layers by type rather than by element order, lines above areas, so a line meant to lie under an area takes an explicit z-index.

## The Transactions view filters with one pattern per column

**Id:** c847f540-ace1-47be-bc6c-e6462c714f55
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** issue #54; maintainer decisions of 2026-11-14 and 2026-11-15 in the experiment, planning and review behind it
**See:** rules.md#rules-match-in-postgresql-and-the-frontend-reads-their-dialect-through-a-translation — 45904d9b-c90f-430b-bcfb-7ed7377067b5 — as of 2026-11-15
**See:** apps.md#every-screen-has-an-address-and-every-move-to-another-screen-is-a-link — 80bdd506-5ada-436c-9c9b-ad23c2d7fbe9 — as of 2026-11-15

A row of filters under the column titles narrows the Transactions view: each takes a pattern in the rules' dialect, unanchored and case-insensitive, over its column's text, and a row shows when every filled filter finds its text.
A column's text is what it shows, except that the category matches its full path, counterparty and description their stored text with line breaks, the account its bank's name and its own, such as `ING Girokonto`, and amount and quantity their value in German without grouping or currency, such as `-1234,56`, a quantity without trailing zeros in its fraction.
Clicking a column title sorts by it ascending, descending, then back to newest first.
The Account filter is the one way to narrow the view to an account, and the Accounts view opens an account's transactions with it set to that account alone, such as `^ING Girokonto$`.
Filters and sort reset when the tab between cash and depot changes or the user leaves the view.

**Reason:** the maintainer's previous finance app had a filter row, and one pattern per column, in the dialect rules already use, covers what its typed filters did, typeahead, wildcard dates and amounts in cents, with one matcher.

**Reason:** account chips above the table narrowed by account a second way, redundant beside the Account filter, which with the bank in its text also tells apart accounts of one name at different banks.

**Reason:** an amount filtered by value finds `-1.234,56 €` from `1234`, and with a comma also from `1234.56`, since `.` matches any character; `,00$` finds round amounts.

**Rejected alternative:** a search box over all columns, alone or beside the filter row, which proved redundant when the maintainer tried both side by side.

**Rejected alternative:** amounts and quantities filtered by their shown text, which `1234` does not find; by their stored decimal as it stands, where padded quantity zeros make `2.5$` miss; or as a plain number with a point, where `1234,56` finds nothing and `-5.00` becomes `-5`.

**Rejected alternative:** account chips kept above the filter row, as the view had before the filter row.

**Rejected alternative:** filters kept in the app shell beside the selected tab, which survive a trip to another view at the cost of state and resets in `App.tsx`.

**Rejected alternative:** a table library such as TanStack Table, which the previous app used, for what a few array operations over each column's text do.

**Consequence:** coming back from another view through the sidebar opens the cash tab with empty filters, while Back returns to the tab and filters left.

**Consequence:** an account's bank shows only as its logo, while its filter text names it.

## The Transactions footer counts and sums the matching rows

**Id:** 097ea4ad-edf7-4387-90be-b7f7576e96ee
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** issue #54; maintainer decision of 2026-11-15
**See:** transactions.md#depot-amounts-as-invested-money — 61823f39-7074-47f5-b70c-e7b5e94916bc — as of 2026-11-15

A sticky footer shows how many transactions match against all in scope, and the exact sum of their amounts, on the cash and the depot tab alike.

**Reason:** a filter answers "how much was this" at once, and on the depot tab a filter gives the sum its meaning, such as the type `distribution` for income, or one security's trades for the money invested in it.

**Rejected alternative:** the count only on the depot tab, and a depot sum shown only while the type is filtered, one more rule to explain and build.

**Consequence:** the unfiltered depot sum mixes net invested money with income, a figure the user reads past.

**Consequence:** the sum shows in euros, as every sum in the frontend does, while a single transaction shows in its own currency.

## The Transactions view renders only the rows in view

**Id:** aed06490-f61d-426d-b8d9-053e22e6c23b
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** issue #54; maintainer decision of 2026-11-15, after trying three ways in the mock mode
**Revisit when:** a cell needs to wrap onto a second line, which breaks the fixed row heights

The table body renders only the rows in and near view with TanStack Virtual, with spacer rows above and below that keep the table at its full height, so the scrollbar spans the whole history; the current month row renders again above the first visible row, so it stays sticky.
The table stays a `<table>`, rows keep fixed heights, and no cell wraps.

**Reason:** rendering every row, not matching, made the view slow: with 3,430 rows in a production build, opening took 207 to 237 ms of JavaScript and commit and clearing a filter 118 to 149 ms, against 11 and 2 ms with TanStack Virtual, which adds about 10 kB gzipped.

**Rejected alternative:** incremental rendering, 200 rows first and 200 more near the end, which needs no dependency but lets the scrollbar cover only the loaded rows, so older months take several steps to reach, and grows the page again on a deep scroll, since loaded rows never unmount.

**Rejected alternative:** rendering every row, as the view did before.

**Rejected alternative:** rows of `<div>`s as the previous app had, which assumed sticky headers and virtualization would not work in a table; both do beside spacer rows.

**Consequence:** the browser's own find reaches only the rendered rows, which the filter row replaces.

## Every screen has an address, and every move to another screen is a link

**Id:** 80bdd506-5ada-436c-9c9b-ad23c2d7fbe9
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** maintainer decisions of 2026-11-15 in the planning behind the change
**See:** apps.md#the-transactions-view-filters-with-one-pattern-per-column — c847f540-ace1-47be-bc6c-e6462c714f55 — as of 2026-11-15

The frontend's address holds where the user is: the path names the view and its tab or its selected account or security, such as `/transactions/cash`, `/accounts/3` by the account's id, `/securities/IE00B4L5Y983` by ISIN and `/rules/categories`, and on the Transactions view the query holds one filter per column, named by the column in lower case, and the sort, such as `?account=%5EING+Girokonto%24&sort=-amount`.
Everything that moves to another screen is an `<a href>`: the sidebar, the tabs, the column titles' sort, selecting and deselecting an account or a security in its table, crumb and donut, and every link to an account's, brand's, category's or rule's transactions.
Every link adds a history entry, while typing in a filter replaces the current one; the sidebar opens each view's first tab, and the open transaction and the edit panels stay out of the address.

**Reason:** the maintainer opens screens in new tabs with Cmd-click and steps back with the browser's controls, and a reload or a bookmark shows the same screen again.

**Reason:** the path holds what the user looks at and the query what narrows it, so a selection and a filter never share a parameter name, and an account's id keeps a link working after a rename.

**Reason:** an entry per keystroke would make Back step through letters, and a sidebar link opens the same screen every time.

**Rejected alternative:** everything in the query, which spares nginx a fallback but makes `account` a selection in one view and a filter in another; everything after a `#`; accounts by bank and name, which a rename breaks.

**Rejected alternative:** one history entry per filter edit, so that Back undoes a filter, at the cost of the input tracking whether it already added one.

**Rejected alternative:** the open transaction and the edit panels in the address, whose unsaved drafts no link brings back.

**Rejected alternative:** sidebar links that follow the last tab used, as the Transactions tab did before, which keeps tab state outside the address.

**Consequence:** nginx answers every path outside `/rpc/` and `/logos/` that names no file with `index.html`.

**Consequence:** Back does not undo a filter, and coming back through the sidebar opens the cash tab without filters.

## The browser's Navigation API follows the links

**Id:** c075c691-545d-42a3-9ef0-154609bd942b
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** maintainer decision of 2026-11-15; probes in Firefox 160 in the planning behind it
**Revisit when:** the frontend has to run in a browser without the Navigation API
**See:** apps.md#every-screen-has-an-address-and-every-move-to-another-screen-is-a-link — 80bdd506-5ada-436c-9c9b-ad23c2d7fbe9 — as of 2026-11-15

`main.tsx` intercepts every navigation to another document, which a link click is, through the Navigation API's `navigate` event, and `useRoute` reads the address on every `currententrychange`; `route.ts` is the one module that parses and builds addresses.
Every link stays a plain `<a href>`, so the browser itself opens a Cmd-click, a middle click or the context menu's new tab in a new tab.

**Reason:** about fifteen lines without a dependency, on an API stable in Firefox 147, Chrome 102 and Safari 26.2 and later.

**Reason:** `history.replaceState` from a filter and Back between the app's own entries are same-document navigations the browser carries out itself, while intercepting them resets focus, which in a probe left a filter after its first keystroke.

**Rejected alternative:** wouter, an established router of 2 to 6 kB, which needs its `<Link>` for every link and one more dependency.

**Rejected alternative:** an own History API `<Link>` with modifier-key checks, `pushState` and a `popstate` listener, which rebuilds what the browser now does.

**Rejected alternative:** React Router or TanStack Router, 10 to 40 kB of route configuration and loaders the frontend has no use for.

**Rejected alternative:** intercepting every navigation, which reset focus out of a filter on each `replaceState`.

**Consequence:** the frontend does not start in a browser without the Navigation API.

**Consequence:** Back restores no list's scroll position, since the views scroll inside their own boxes and the API restores only the document's.

## A transfer shows as one row when both its sides are listed

**Id:** e90e05d7-b504-4cfc-9973-d19e2b6ddda1
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** maintainer decisions of 2026-11-15 in the planning dialogue, after an HTML mockup of three layouts, in four mock-mode rounds and in a look at the real data
**See:** transactions.md#transfers-between-accounts-are-recognised-by-equal-opposite-amounts-on-every-read — ef87172b-df77-4e67-8df8-5229ab435f42 — as of 2026-11-15
**See:** apps.md#the-transactions-footer-counts-and-sums-the-matching-rows — 097ea4ad-edf7-4387-90be-b7f7576e96ee — as of 2026-11-15

In the Transactions view, a transfer whose two sides both match the filters shows as one row at the sending side's date, with its amount unsigned in grey; a side whose partner is filtered out or sits in the other tab, as a purchase's cash and depot sides always do, shows alone with its signed amount.
Every transfer side's Account cell reads "From → To", such as `Spending → ETFs` in both tabs, its Brand, Category, Counterparty and Description stay empty, as their filter texts do, and its panel shows the transfer with a From and a To side, each with its own texts.

**Reason:** the maintainer wants a transfer to read as one thing from the paying to the receiving account, while the footer still sums the matching sides, so a merged row adds 0 and the shown amounts always add up to the footer.

**Reason:** a transfer's counterparty is the owner or the other bank and its description mostly bank boilerplate, both repeating "From → To".

**Rejected alternative:** two linked rows that name each other and highlight their partner on hover, the agent's recommendation, cheaper but still showing a transfer twice.

**Rejected alternative:** a Transfers tab with the transfer sides removed from Cash and Depot, after which an account's rows no longer add up to its balance change; one list for cash and depots, so that a purchase merges too, which mixes their columns and sums cash with invested money.

**Rejected alternative:** a lone side unsigned like a merged row, either with the footer unchanged, so the shown amounts no longer add up to it, or left out of the footer, which then no longer equals an account's balance change.

**Rejected alternative:** a lone side naming only the other account, and transfers marked "⇄ Transfer" in the Brand column, both tried in the mock rounds; the counterparty and description kept as delivered, or the description alone, which sometimes names a savings plan's security or the owner's own reference.

**Consequence:** a counterparty or description filter no longer finds a transfer, such as `Vanguard` for savings plans in the Cash tab, which the Depot tab's Security column still finds.

**Consequence:** the footer counts a merged transfer once, against all rows of the tab with every transfer merged.
