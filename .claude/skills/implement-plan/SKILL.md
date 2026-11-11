---
name: implement-plan
description: Implement an approved plan from a `docs/planning/` directory in its own worktree.
---

# Implement plan

1. Find the planning directory the user names, by number or task, under the main checkout's `docs/planning/`, and keep its absolute path.
   When the user names none, read the status line of every `PLAN.md` there and ask with the interactive question tool which plan to implement, offering the approved plans that are not done yet, newest first.
2. Read every file in it and the files its plan points to.
3. Enter a worktree named after the directory's task with Claude Code's worktree tool, and run this skill's `scripts/setup-worktree.sh` in it.
4. Carry out `PLAN.md` step by step in the worktree, keep its status and its steps' "Done: " markers current through the absolute path, and finish with its validation.

Follow the [working rules](../decision-dialogue/SKILL.md#working-rules) throughout.
