# Finance Tracker

A single-user, self-hosted tracker that collects the transactions of its user's accounts, depots included, stores them, and shows them.
No component is implemented yet.

It consists of a web frontend, a backend with PostgreSQL that also fetches from the Enable Banking API, and a Firefox extension that reads the bank websites no affordable API reaches.

## Further reading

- [Architecture](./docs/architecture.md): components, data flows, repository layout, hosting and security.
- [Decision records](./docs/adr/): why the system is built as it is, including why Enable Banking and which bank takes which ingestion route.
- [Glossary](./GLOSSARY.md): the domain terms every doc and issue uses.
- [Contributing](./CONTRIBUTING.md): local setup, adding a workspace, the quality gate and dependency updates.

## License

[MIT](./LICENSE)
