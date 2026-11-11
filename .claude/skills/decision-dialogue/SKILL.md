---
name: decision-dialogue
description: Do a Q&A with a user to refine an idea into an actionable plan. Use whenever the user wants to do a Q&A.
---

# Decision dialogue

## Establish the record

1. Read the user's request, relevant evidence, and the existing directories under `docs/planning/` before asking questions.
2. At the start of each new Q&A, run this skill's `scripts/setup.sh <task title>` with task title in kebab-case, and reuse the planning directory it prints throughout that Q&A.
3. Fill the files the script created from the available information, in each template's sections and entry formats, marking proposals as provisional and unknowns as open:
   - `GOAL.md`: the whole idea at a high level, written for a product owner to confirm it was understood: the desired state, its scope and guiding principles, and success criteria they can observe, free of implementation detail.
   - `INVENTORY.md`: the verified current state and its sources.
   - `QUESTIONS.md`: the unresolved questions and choices.
   - `DECISIONS.md`: every choice made, with its rationale.
   - `PLAN.md`: the detailed technical implementation of `GOAL.md` without retelling it: the coding principle most at risk and how the design guards against it, every step with the files, data and interfaces it touches, and the technical checks that prove the success criteria.

## Resolve the questions

1. Research what can be answered without the user and update `INVENTORY.md`.
2. Fill the `QUESTIONS.md` file with unresolved questions.
   Order them by impact so the highest-impact questions are addressed first.
   Prefer a general direction-setting question over item-by-item choices.
3. Ask the highest-impact unresolved question, exactly one question at a time using the interactive question tool.
   Give the user the context and tradeoffs needed to decide, append `(recommended)` to the end of an answer option when you clearly prefer it, and wait for their answer.
4. After each answer, remove a resolved item from `QUESTIONS.md`, record a decision and its rationale in `DECISIONS.md` or a factual answer in `INVENTORY.md`, update affected planning files, and reprioritize questions before asking again.
5. Keep deferred or unanswered questions under `QUESTIONS.md` and repeat until every material question and decision is resolved.

## Hand over the plan

1. Present the final goal, decisions and plan, and ask with the interactive question tool how to proceed, offering these options:
   - **Confirm and implement here**: implement the plan in this session.
   - **Confirm and implement in a new session**: hand the plan over to `/implement-plan` in a fresh session.
   - **Request changes**: change the plan before confirming it.
2. On a change request, apply it through the question loop, then ask again.
3. On either confirmation, set the plan's status to approved with today's date.
4. To implement here, invoke the `implement-plan` skill with the planning directory.
5. To hand over, first make the planning directory self-contained: move everything only this session knows into it, such as research results, probe output, the user's statements and scratchpad files, until a new session that reads only the directory and the repository lacks nothing.
   Then tell the user to run `/implement-plan <NNNN>` with the directory's number in a new session.

## Working rules

- Make the planning directory your home for this Q&A: keep every artifact of the work in it rather than in the session scratchpad, add whatever serves the work beside the template files, such as notes, code drafts, scripts, probe results, gathered data or mockups, and reference other planning directories wherever that helps.
- Keep everything under `docs/planning/` local: never stage or commit it, and leave it in place once the work is done.
- Write everything outside `docs/planning/` to stand on its own: carry a decision's substance in full into its proper home, and leave out every path, link and mention that only the planning files explain, such as decision numbers, plan step names or "as agreed in the Q&A", in docs, code comments, commits, issues and pull requests.
- Label assumptions clearly, better yet create an open question in `QUESTIONS.md` instead.
- Give each fact one home.
- Cite sources where available.
