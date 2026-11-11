# One backend, one frontend and a browser extension

The finance tracker is one system of three apps in one repository, built and extended together: the backend with its PostgreSQL, the frontend and the browser extension.
The backend stores whatever the system needs, user-entered data such as opening balances included, and its API serves the frontend and the browser extension alone, so it changes together with them, without versioning or compatibility promises.
The frontend is where the user can manage everything, accounts included, and shows each raw transaction beside its normalized transaction so the user can check extraction, while the browser extension keeps creating, renaming, removing and syncing accounts.
This supersedes [ADR 0005](./0005-bank-data-service-with-the-extension-as-its-interface.md), whose bank data service of backend and extension served consumers of its own and left them opening balances and the views of the dropped web frontend, and [ADR 0010](./0010-consumers-read-raw-transactions.md), which let those consumers read raw transactions.

## Considered options

- The bank data service with consumers of its own, which kept user-entered data and finance logic out of the backend and made every feature that needs them wait for a consumer service with a backend of its own.
- The frontend as a viewer of the transactions only, with the popup as the one place to manage accounts.
- The popup shrinking to syncing once the frontend manages accounts, as [ADR 0001](./0001-separate-web-frontend-and-thin-extension.md) once decided.

## Consequences

- Account management exists in both the frontend and the browser extension, so the logic both need lives in `packages/shared`.
- Finance logic builds on normalized transactions alone, because a raw transaction's shape changes with every new shape version.
- A mobile app, if one comes, joins as a fourth app of this repository on the same backend and shared package, and nothing is built for it before then.
