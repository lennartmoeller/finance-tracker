# Finance Tracker

A single-user, self-hosted tracker that collects the transactions of its user's accounts, depots included, and stores them for the services that use them.
So far it syncs ING accounts and the Trade Republic cash account and stores their raw transactions.

Its first service, the bank data service, consists of a backend with PostgreSQL and a Firefox extension that reads the transactions from the bank websites in the user's own sessions and is the service's only interface.
Later services, such as finance logic and a frontend, consume the bank data service's API.

## Further reading

- [Architecture](./docs/architecture.md): the bank data service's components, data flows, repository layout, hosting and security.
- [Decision records](./docs/adr/): why the system is built as it is, including why every account is read from its bank's website.
- [Glossary](./GLOSSARY.md): the domain terms every doc and issue uses.
- [Contributing](./CONTRIBUTING.md): local setup, running the system, the quality gate, extension releases and dependency updates.

## License

[MIT](./LICENSE)
