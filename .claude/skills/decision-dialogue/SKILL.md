---
name: decision-dialogue
description: Do a Q&A with a user to refine an idea into an actionable plan. Use whenever the user wants to do a Q&A.
---

# Decision dialogue

## Establish the record

1. Read the user's request, relevant evidence, and existing planning documents before asking questions.
2. At the start of each new Q&A, create a fresh `planning-<task>` directory directly under the repository root and reuse it throughout that Q&A.
3. Add a `.gitignore` containing only `*` to that directory so all its contents, including `.gitignore`, are ignored by Git; never stage or commit the directory.
4. Treat the directory as temporary, keep all planning artifacts inside it, add no references to it in files outside it, and leave its deletion to the user.
5. Create the following files using the available information, marking proposals as provisional and unknowns as open:
  - `DECISIONS.md`: Records choices, rationale, and approvals.
  - `GOAL.md`: Desired future state, guiding principles, scope, and success criteria.
  - `INVENTORY.md`: Verified current state and sources, with assumptions clearly labeled.
  - `PLAN.md`: Proposed or approved steps, dependencies, and validation.
  - `QUESTIONS.md`: Ranks unresolved questions and choices by impact and prerequisites.

## Resolve the questions

1. Research what can be answered without the user and update `INVENTORY.md`.
2. Fill the `QUESTIONS.md` file with unresolved questions.
   Order them by impact so the highest-impact questions are addressed first.
   Prefer a general direction-setting question over item-by-item choices.
3. Ask the highest-impact unresolved question, exactly one question at a time using the interactive question tool.
   Give the user the context and tradeoffs needed to decide, append `(recommended)` to the end of an answer option when you clearly prefer it, and wait for their answer.
4. After each answer, remove a resolved item from `QUESTIONS.md`, record a decision and its rationale in `DECISIONS.md` or a factual answer in `INVENTORY.md`, update affected planning files, and reprioritize questions before asking again.
5. Keep deferred or unanswered questions under `QUESTIONS.md` and repeat until every material question and decision is resolved.
6. After all questions are resolved, present the final decisions and plan to the user for confirmation.

## When updating files

- Label assumptions clearly, better yet create an open question in `QUESTIONS.md` instead.
- Give each fact one home.
- Cite sources where available.
