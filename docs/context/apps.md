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

**Consequence:** account management exists in both the frontend and the browser extension, so the logic both need lives in `packages/shared`.

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
