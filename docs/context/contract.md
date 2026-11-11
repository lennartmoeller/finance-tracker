# Contract

## The contract is an overview, and its rules live in the code

**Id:** f6104f1e-e7f4-4924-9f6f-e1c4eea93e08
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** conversation with the maintainer, 2026-11-11

`docs/contract/` gives a newcomer the overview needed to understand the architecture: the components and outside services, the flows between them, each bank's adapter, the data model with every column, and the API, mostly as Mermaid diagrams that may carry detail, with prose only for what a diagram cannot show.
Rules, constraints, procedure signatures and errors live only in the code and its tests, and reasons and procedures in `docs/context/` and `CONTRIBUTING.md`.

**Reason:** the shortest contract that still lets a reader understand the system, with every detail kept where the code or another document already holds it.

**Rejected alternative:** an exhaustive specification of every column, branch, error and value, so that a reviewer never needs the code, which repeats the schema and the API contract.

**Rejected alternative:** everything the owner would want to approve before it changes, invariants and the database's rules included, which keeps promises in the contract that the code and its tests already hold.

**Consequence:** a change that breaks an invariant shows no diff in the contract, so only the code review and the tests catch it.

## The contract is split by topic

**Id:** aa895db6-f899-4fea-aa1c-d4f387580084
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** conversation with the maintainer, 2026-11-11
**See:** contract.md#the-contract-is-an-overview-and-its-rules-live-in-the-code — f6104f1e-e7f4-4924-9f6f-e1c4eea93e08 — as of 2026-11-11

`docs/contract/` holds one file per topic, named like the `docs/context/` topic where one fits, so that the what and the why of a topic share a file name, and the repository's `README.md` holds the system overview and links every file.
A flow that crosses apps lives in its topic's file, and the data model stays one diagram, because its relations read only as a whole.

**Reason:** a reader looks for a topic rather than an app, and flows such as a sync or a price fill cross apps.

**Rejected alternative:** one architecture file with every component, flow and operation, which grows into one long file.

**Rejected alternative:** one file per app or package, which leaves each cross-app flow to the file of an app that owns it.

**Rejected alternative:** one file per kind of information, such as components, flows, data model and hosting, whose flows file becomes the next catch-all.

**Rejected alternative:** a `README.md` in `docs/contract/` as the entry, which repeated the repository's `README.md` in describing the apps and linking the context.

## Terms live in the code, without a glossary

**Id:** e99bf87b-af59-4812-bd73-4bbc8e5c3fff
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** conversation with the maintainer, 2026-11-11

The repository keeps no glossary: the code's names carry the terms, and the contract explains a term in a few words where a newcomer could not work it out.

**Reason:** the glossary was a leftover of an earlier agent setup, the code, the schema, the tests, the contract and `docs/context/` already carried every meaning, and parts of it had drifted from the code, such as an opening balance that no code has.

**Rejected alternative:** folding the glossary into `docs/context/`, whose entries record decisions, workarounds, incidents and constraints with their reasons, while its definitions and avoided names recorded none.
