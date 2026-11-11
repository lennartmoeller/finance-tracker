# Finance Tracker

A single-user, self-hosted tracker that collects the transactions of its user's accounts, depots included, and stores them for the services that use them.
So far it syncs the ING, Trade Republic and Deutsche Bank accounts, depots included, and the finvesto depot, and stores their raw transactions together with the normalized transactions extracted from them.

Its first service, the bank data service, consists of a backend with PostgreSQL and a Firefox extension that reads the transactions from the bank websites in the user's own sessions and is the service's only interface.
A second service, the transaction viewer, reads the bank data service's API to show each account's normalized and raw transactions, so the user can check the data; later services, such as finance logic, consume the same API.

## Further reading

- [Architecture](./docs/architecture.md): the bank data service's components, data flows, repository layout, hosting and security.
- [Data model](./docs/data-model.md): the database's tables, how they connect, and the rules the database enforces.
- [Decision records](./docs/adr/): why the system is built as it is, including why every account is read from its bank's website.
- [Glossary](./GLOSSARY.md): the domain terms every doc and issue uses.
- [Contributing](./CONTRIBUTING.md): local setup, running the system, the quality gate, extension releases and dependency updates.

## License

[MIT](./LICENSE)
