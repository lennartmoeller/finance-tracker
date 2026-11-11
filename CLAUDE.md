# General coding instructions

## Foundational coding principles

These principles govern every change to this repository, everywhere.
Do not accept a change that violates them — not one you write, not one you asked to write.

Read them as decision criteria: each exists to keep the codebase small enough that an agent can hold a stage in its head from the stage's own script.

### How to apply them

Before writing, name the principle the change is most likely to break, state it in the plan or pull request description, and design against it.

### D1: Keep the design simple

- Optimize for KISS and YAGNI.
- Prefer boring, direct, synchronous code.
- Avoid over-engineering, speculative architecture, unnecessary structure, abstraction, tools, ceremony.
- Grow structure only when files too large or real reuse appears.
- No adapters, managers, services, factories, base classes, engines, callbacks, matrices, abstraction layers by default; add one only when it clearly cuts duplication, names real logic, standardizes necessary cross-cutting behavior, or makes contract or test clearer.
- No generic plan/apply/dry-run patterns; each stage does work it named for, directly.
- Count a design's complete cost before preferring it: helper code, call-site changes, wiring, setup, tests, migration; a shorter edited function that exports complexity is not simpler.

### D2: Keep the code small and DRY

- Optimize for DRY, shortest clear solution, minimal LoC.
- Avoid boilerplate and repetition.
- Duplicated code = bug.
- Consider extraction at second occurrence, extract immediately at third.
- Shrink by real deduplication and simplification only, never by reflow, minification, compressed fixtures, hidden machinery, weaker errors, or deleting meaningful tests.
- Judge size across the maintained surface: code, tests, fixtures, files, interfaces, rules, dependencies, and required context; measure it before and after by an agreed scope, including untracked files, separate unrelated growth, and let no single metric decide alone.

### D3: Optimize for coding-agent maintainability

- Code only read and changed by agents.
- Prefer explicit contracts and precise domain meaning over clever or merely shorter code.
- Coding agent must understand stage from its script alone.
- When unsure, choose shorter clear solution unless architectural one clearly pays for itself.

### D4: Refactor and delete instead of accumulating code

- Prefer refactoring existing code over adding new code.
- Change existing code rather than adding code beside it, state what change deleted; change that only adds must state why nothing could be removed.
- After each change, ask whether existing code can be simplified or removed as result, do it in same change.
- Delete dead code immediately, let quality gate fail on unused symbols, unreachable branches, unreferenced files, fallbacks for conditions that cannot occur, so leftovers cannot survive commit.
- Never leave commented-out code, unused symbols, speculative code, compatibility shims for removed behavior.

### D5: Use one standard solution per recurring problem

- One canonical solution, one tool per recurring problem.
- Do not solve same problem twice.
- No second or overlapping tool for already solved category.
- Prefer established, familiar standards over custom infrastructure.
- Pin every tool and dependency once, where the update bot tracks it.

### D6: Make every exposed surface earn its place

- Every environment variable, exposed option, output field, object property must have real consumer or decision behind it.
- Add exposed surface area only when needed.
- Remove inputs, outputs, and options that every caller sets identically or nobody reads.

### D7: Let the code speak for itself

- Default = no comment, no construct requires one; write one only where reader cannot understand code without it.
- Before writing comment, remove need for it by renaming, restructuring, or asserting fact in test; write it only when none of those can carry it.
- Comment carries only what code cannot show: external constraint, provider quirk, business rule, or why obvious alternative rejected. Never restatement of name, never heading over list that already reads as one, never fact that already lives in another file or in these principles.
- Delete comment reader would have understood without, including one that predates change.
- Keep docs and Markdown to minimum that leaves nothing unknowable.

### D8: Give every thing one name and one home

- Give every concept one module named for domain, so name of thing looked for = name of file it lives in.
- Never let one name stand for two concepts: two constants sharing a name across modules while holding different values is a defect, so name each for the thing it identifies.
- Keep everything of one kind in one place, no exceptions, nothing embedded elsewhere.
- Keep reusable scripts, templates, and stylesheets in files of their own kind.
- Use as few languages as problem allows, justify each one that remains by what removing it would cost.

### D9: Test the essential behavior of your own code

- Test by the Pareto principle: only essential behavior and consequential failures, full coverage is no goal.
- Write bold tests: assert the outcome that matters, not every detail; let one representative case cover several transitions.
- Test only the code the suite is built for, e.g. a Python suite tests Python, not schemas, workflows, JSON, or YAML.

## Working on a change

- Read the repository-root `CONTRIBUTING.md` before making changes and follow its applicable contributor procedures.
- Only for implementation changes and only at the complete end after fully implementing a change, run the repository's canonical quality gate.
- By default, keep changes in the repository uncommitted and only commit or push after receiving the explicit instruction to do so.
- If instructed to commit, only commit to a feature branch, not directly to the main branch; create the feature branch from latest main if it not exists yet.
- Always use Conventional Commits for commit messages.

## Repository knowledge files

- Keep each file current, concise and focused on its reader's task.
- Give each fact or rule one canonical home and link to it instead of maintaining duplicate explanations.
- Keep implemented contracts in code, schemas, workflows and tests; generate references from those sources where needed.

### `CLAUDE.md`

- Give coding agents concise repository-specific constraints and preferences governing their changes, rather than an implementation tour or contributor manual.
- Keep root rules repository-wide and place directory-only rules in nested `CLAUDE.md` files at the relevant scope.
- State each rule as one imperative sentence an agent can check.

### `CONTRIBUTING.md`

- Maintain a root guide for contributors preparing, extending and verifying changes, including necessary local setup, authoring conventions and check procedures.
- Point to canonical commands and source contracts instead of copying architecture, package, dependency, API or schema catalogs.

### `README.md`

- Give humans a selective overview of the repository's purpose, high-level architecture and boundaries, how to start, and where authoritative guidance for each reader task lives.
- Link to contributor and task-specific guides for detailed procedures, keeping the overview focused rather than turning it into a complete repository manual.

## Skills to use

- Use the `contract-authoring` skill after implementing a change, to keep `docs/contract/` true to the code.
- Use the `markdown-authoring` skill whenever writing or editing a Markdown file.
- Use the `workflow-authoring` skill whenever writing or editing a GitHub Actions workflow or action.
