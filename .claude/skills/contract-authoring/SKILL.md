---
name: contract-authoring
description: Write and update `docs/contract/`, the architecture overview the user owns and the coding agent keeps true to the code. Use after implementing a change, or when the user asks to write or update the contract.
---

# Contract authoring

`docs/contract/` gives a newcomer the overview needed to understand the system's architecture, so the user, who owns it, reviews the architecture without reading code.

## Content

- Cover the components and outside services, the data model, the interfaces between them, and the flows across them with each step that reaches another component or an outside service and what it delivers.
- Show each in Mermaid diagrams, which may carry detail, and add prose only for what a diagram cannot show.
- Describe the current state only, without history or plans.
- Leave to their own homes, and link where a reader needs them: rules, constraints, inputs, errors and each component's internals to the code and its tests, the why to `docs/context/`, procedures to `CONTRIBUTING.md`.
- Keep one topic per file, and the system overview with a link to every file in the repository's `README.md`.

## Update after a change

`/implement-plan` invokes this skill once a plan is implemented and validated; after a change without a plan, invoke it once the change is implemented.
On the change's own branch:

1. Read the branch's changes against `main`, and the planning directory when there is one.
2. Rewrite every statement in `docs/contract/` the changes make false, add what they leave missing, and delete what no longer exists.
3. List every contract change that no planning decision or user instruction covers, in your report and in the pull request description.
