---
name: contract-authoring
description: Update `docs/contract/`, the system's binding architecture overview, after an implementation. Use when a change is implemented or the user asks to bring the contract up to date.
---

# Contract authoring

`docs/contract/` is an architectural overview over the whole project.
Humans use it to understand and review the architecture of the project.
It can also be viewed as a contract between the coding agent, who owns the code, and the human who owns `docs/contract`.

## Depth

Describe the system at component level, with every promise it makes and every branch it takes:

- **Components**: each app, process and external service, what it owns, and the single place that owns a cross-cutting concern, such as the only module that calls a service.
- **Promises**: the guarantees and invariants a reader relies on, each with the mechanism that keeps it, such as a write that commits all or nothing so a reader never sees half of it.
- **Behavior**: each flow with its success path, every failure path, and what the system does next in each.
- **Values**: the concrete numbers that shape behavior, such as timeouts, limits, intervals and sizes.
- **Data**: every table with every column, its type, keys, nullability and allowed values, the relations between the tables, and every rule the database enforces.
- **Purpose**: the use cases, each with its consumer, what it reads and the call or query it makes, so every table and procedure traces to a consumer.
- **Interface**: how a consumer uses the system: its calls, their inputs with defaults, their responses, and every error with its cause.
- **Operations**: hosting, availability, alerting and logging, as far as they promise something.

Stop at the component boundary: functions, classes and file layout inside a component stay in the code, except the single place that owns a concern.
Where the code already holds an exhaustive list, such as every log record, state the rule and name the code as the list.

Leave to their own homes, and link where the contract needs them:

- why one option won over others: `docs/context/`, through the keep-the-why skill;
- what a term means: `GLOSSARY.md`;
- how to set up, develop, check or release: `CONTRIBUTING.md`;
- rules for the code of one app: that app's `CLAUDE.md`;
- planned work: issues.

## Form

Write with the `markdown-authoring` skill, and shape the contract on top of it:

- One file per kind of information: `architecture.md` for components, promises, behavior, values and operations, `data-model.md` for the data, `use-cases.md` for the purpose, and `user-guide.md` for the interface; add a file only for a kind none of them holds.
- One section per mechanism, named for it, that opens with its promise in one or two sentences, follows with its diagram, and closes with what the diagram cannot show: reasons as "so" clauses, values and edge cases.
- A `sequenceDiagram` with an `alt` branch per outcome for behavior over time, a `flowchart` for structure and data flow, and an `erDiagram` with every column for the data.
- Tables for enumerations and traceability, such as every error with its cause, or every table with the use cases that read it.
- Runnable examples for the interface and the use cases: commands, queries, and request and response bodies.
- Present tense and the current state only.

## When to update it

`/implement-plan` invokes this skill once a plan is implemented and validated; after work without a plan, run it once the change is implemented.
Update the contract on the change's own branch, so the pull request carries it:

1. Read the branch's changes against `main`, and the planning directory when the change has one.
2. Find every fact in `docs/contract/` the changes make false or homeless, and every new fact that belongs in it.
3. Rewrite each in place to the state after the change, and delete what no longer holds.
4. List every contract change that neither a decision in the planning directory nor an instruction of the user covers, in your report and in the pull request description.
