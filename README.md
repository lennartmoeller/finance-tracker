# Finance Tracker

A single-user, self-hosted tracker that collects the transactions of its user's accounts, depots included, stores them, and shows them.
No component is implemented yet.

It consists of a web frontend, a backend with PostgreSQL, and a Firefox extension that reads the transactions from the bank websites in the user's own sessions.

## Further reading

- [Architecture](./docs/architecture.md): components, data flows, repository layout, hosting and security.
- [Decision records](./docs/adr/): why the system is built as it is, including why every account is read from its bank's website.
- [Glossary](./GLOSSARY.md): the domain terms every doc and issue uses.
- [Contributing](./CONTRIBUTING.md): local setup, adding a workspace, the quality gate and dependency updates.

## License

[MIT](./LICENSE)
