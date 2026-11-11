# Finance Tracker

A single-user, self-hosted tracker that collects the transactions of its user's accounts, depots included, stores them, and lets the user view and manage them.
So far it syncs the ING, Trade Republic and Deutsche Bank accounts, depots included, and the finvesto depot, and stores their raw transactions together with the normalized transactions extracted from them.

It consists of three apps: a backend with PostgreSQL that stores all data, a frontend in which the user views and manages that data, and a Firefox browser extension that reads the transactions from the bank websites in the user's own sessions.

## Further reading

- [Architecture](./docs/contract/architecture.md): the apps, their data flows, repository layout, hosting and security.
- [Data model](./docs/contract/data-model.md): the database's tables, how they connect, and the rules the database enforces.
- [Context](./docs/context/index.md): why the system is built as it is, including why every account is read from its bank's website.
- [Glossary](./GLOSSARY.md): the domain terms every doc and issue uses.
- [Contributing](./CONTRIBUTING.md): local setup, running the system, the quality gate, browser extension releases and dependency updates.

## License

[MIT](./LICENSE)
