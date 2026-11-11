# Domain docs

This repository uses a single-context layout: one `GLOSSARY.md` and one `docs/adr/` at the repository root, covering every app and package.
Split it into one context per app only once a term must mean different things in two apps.

## Read before exploring

- Read `GLOSSARY.md` for the domain vocabulary.
- Read the ADRs in `docs/adr/` that touch the area you are about to work in.

When either is missing, proceed silently without flagging it; the `/domain-modeling` skill, reached via `/grill-with-docs` and `/improve-codebase-architecture`, creates both lazily once terms or decisions get resolved.

## Use the glossary's vocabulary

When your output names a domain concept, such as in an issue title, a refactor proposal, a hypothesis or a test name, use the term as `GLOSSARY.md` defines it.
Avoid synonyms the glossary explicitly rejects.
A concept missing from the glossary signals either invented language the project does not use, so reconsider it, or a real gap, so note it for `/domain-modeling`.
Leave an existing ADR's body in the wording of its time, even where the glossary has since renamed a term, and change only its status line when a later ADR supersedes or amends it and its links when their targets move.

## Flag ADR conflicts

When your output contradicts an existing ADR, surface it explicitly instead of silently overriding it:

> _Contradicts ADR-<number> (<title>), but worth reopening because <reason>._
