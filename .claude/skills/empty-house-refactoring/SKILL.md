---
name: empty-house-refactoring
description: Rewrite a repository from its idea in an emptied checkout, without copying its structure or code.
disable-model-invocation: true
---

# Empty-house refactoring

A repository gets messy over time, and bad practices creep in unnoticed.
Its state is the result of many decisions made one after another, each bound by the ones before it, and some of them were poor.
Others are the maintainer's deliberate preferences, and they look poor only to someone who ignores why they were made.
Job one is to tell the two apart.
Job two is to understand the idea behind the repository, what it must do and how the maintainer wants it built, and to implement that idea the best way possible, as if the history of decisions had never happened.
Refactoring in place, or copying the original's architecture, structure or code, carries the history's mistakes into the result, so the whole repository is written anew and every part has to earn its way back in.

## Setup

The run uses two checkouts of one repository, and the maintainer prepares both before invoking the skill:

- **The original** is the repository's clone itself, on the default branch with a clean tree, which `git worktree list` shows as the checkout on the default branch.
  Read it, search it and run it to learn facts, and never change it.
- **The empty house** is a linked worktree of that clone, on a branch from the default branch that the maintainer emptied, and the session runs in it.
  The maintainer removed what they want rewritten and kept what they consider good, always including the agent instructions and skills, because the skill and the rules load from there.
  What they kept is already good: adjust it if necessary, but do not rewrite it.
- Everything else enters the empty house by being written anew, never by copying.

What to keep is the maintainer's call, so never empty a checkout yourself.
Stop and ask the maintainer to fix the setup when the session runs on the default branch, no checkout is on the default branch, or the original's tree is not clean.

## Intake

Inspect the setup before anything else: `git worktree list`, the content of the empty house and `git log HEAD..<default branch>`.
That shows where the original is, what the maintainer kept and what reached the default branch since the empty house branched off.
Then work to the end without waiting.
Ask only when a preference that nothing the maintainer wrote settles blocks the work, and never about technique.
Take your time, because the biggest decisions deserve the most of it and a fast run skips the checks that matter.

## What binds you

Read every input the maintainer wrote completely before designing: the agent instructions, contributor instructions, documentation, skills, and the content of the empty house.
The preferences live in these files, and the target structure follows from them.
Follow this order:

1. The external contract stays: the API that other systems call, the environment variables that other systems set, and the CI, release and deployment contracts.
   Everything internal may change, including the schema of stored data, as long as the existing data is migrated to it.
2. The rules bind without exception: what the maintainer typed after the command, the agent and contributor instructions, and the skills.
   When the new layout changes the mechanism of a rule, reword the rule.
   Never invert a rule, and drop one only when the thing it governs no longer exists.
   List every rewording and every drop in the report.
3. Recorded decisions, wherever the repository keeps them, bind by their reason.
   When the reason is what the maintainer wants, it is a preference and stays.
   When the reason is technical or the agent's, reverse the decision only if the rewrite is clearly simpler, record the reversal where the decisions live and list it in the report.
4. Everything else is open.

## Facts from the original, form from the idea

Read the original for facts: what it does, the external contract, and the knowledge its code holds that nothing else records, such as a provider quirk or an edge case found in production.
Take no form from it: its architecture, levels, folder structure, internal names and code shape are outcomes of the history, not of the idea.
A form that a rule or a preference of the maintainer asks for belongs to the idea, so it stays.
Design the target from the idea alone, and only then hold the original against it, to find facts the design missed, never to borrow its shape.
A design that ends up resembling the original is fine when it got there from the idea.

## Stages

Keep the plan and any notes in a git-ignored `planning-empty-house/` directory at the root of the empty house, with a `.gitignore` that contains only `*`.
Reference it from nothing outside it and leave its deletion to the maintainer.

1. **Plan.**
   Write the idea down first: per capability, what it does, the contract it serves and the facts its implementation must respect.
   Design from it with the biggest things first, because they decide the most: architecture, levels such as a core and units that each own one feature, integration or module, ownership and repository structure.
   Then take the biggest thing left, again and again, and end with details such as writing functions better, with documentation last.
   Close by holding the original against the plan: each of its behaviors and facts is in the plan or dropped with the reason and the rule it serves.
2. **Paper test.**
   Run the design through the changes the repository sees, for example adding a unit, deleting one, changing an interface or changing shared state while old and new versions run side by side.
   Each change must touch one folder, plus the core only for generic changes.
3. **Critique.**
   Let a subagent critique the plan: does it break a rule, a preference of the maintainer or the target structure, does it copy a form of the original that the idea does not justify, and does it hide a technical risk?
   Include the preference check, because a critique of technical risk alone lets a plan that overrides the maintainer pass.
4. **Build.**
   Write the contract that units follow first, then implement the units in parallel, one subagent per unit folder, each with the rules and its folder as its whole scope.
   Subagents do not see this skill, so give each its unit's idea from the plan as its spec, and tell it to read the original only for facts, never to copy or translate its code.
   Run the quality gate only yourself, because parallel runs collide on shared resources such as a database.
5. **Review.**
   Let a second subagent review code and docs against the rules, and fix its findings.

## Documentation

Write the documentation last, when the code exists, so that every statement is true of the new code.
Give each file the role the repository's rules define, and keep a procedure that several files need in one home that the others link to.
Carry over each overview artifact and check it against the new code: every element of every diagram must exist in the code, and reasons are linked to where the decisions live instead of copied.
Where the repository records decisions, fold update chains into the current truth, resolve or flag every claim that the rewrite made stale, and end smaller than you started.

## Finish

1. Run the repository's canonical quality gate, and build what the repository ships, such as a package or an image, if the environment allows it.
2. Prove the promises of the target structure on a scratch copy that you delete afterwards, for example by removing one leaf unit's folder, searching the core for unit names and showing that the gate still passes.
3. Check that no rule is violated.
4. Check `git log HEAD..<default branch>` for commits that reached the original after the empty house branched off, and re-apply their intent in the empty house, keeping the version and changelog of the default branch.
5. Leave everything uncommitted.

Report in this order and keep it short:

1. A table of before and after for files, production code lines by language, tests and test lines, docs lines and decision-record lines, measured with one scope that includes untracked files.
2. The decisions you reversed and the rules you reworded or dropped, each with its reason, and behavior that changed despite the contract.
3. What needs the maintainer's action and the risks that remain.
