---
name: markdown-authoring
description: Author and edit Markdown in house style - structure, wording, and formatting conventions for docs, READMEs, guides and any other .md file. Use this skill whenever you are writing a new Markdown file or editing an existing one, or when asked to write, restructure, clean up, or review documentation, a README, a guide, or any prose that will render as Markdown — even if the word "Markdown" is not used.
---

# Markdown Authoring

Conventions exist so readers scan file top-to-bottom, reach right page and section fast, so every fact have exactly one place to change.
Optimize every file for two people: reader discovering content, and next editor — usually you.

## Precision

Keep every Markdown file precise.
Precise means shortest text that still carries exact detail reader needs for task — no less, no more.
Two ways to miss it, both failures: too much buries action reader came for, too little forces reader to guess, ask, or leave page to finish task.
Match depth to reader task, because same fact is signal on one page and noise on another.
Tune detail level to what reader actually needs, then cut everything else.

Before adding sentence, ask what task reader on and whether sentence changes what they do next.
Include only what reader needs to complete task or make decision.

## Wording

Write exactly one sentence per line.
Give each sentence own single line, however long, and never break sentence across lines.
Do not hard-wrap at 80, 100, or any fixed column; ignore any editor, formatter, or agent habit that reflows prose to character limit.
Line break marks sentence boundary and nothing else.

Markdown renders consecutive lines as one paragraph, so rendered output identical either way.
Reason for rule is diff: one sentence per line means reworded sentence touches exactly one line, whereas column-wrapping reflows and re-diffs whole paragraph.

Write in positive, helpful, current-state voice.
Prefer stating responsibility positively over negating it: "the platform team owns X" reads better and ages better than "you are not responsible for X".

## Heading case

Write every heading in sentence case, and same for frontmatter `title` and `linkTitle`.
Sentence case means: capitalize first word and first word after colon, lowercase every other word that is not capitalized on its own.
So "Migration from Azure DevOps", "Request an organization", "Security and compliance".

Never title case, however conventional it looks.
"Request an Organization", "Add the Workflow", and "Base Images Behind a Cache" are wrong; "Request an organization", "Add the workflow", and "Base images behind a cache" are right.

Keep proper names, product names, acronyms, and code identifiers in their own casing, wherever they sit, even as first word: "ado2gh Migration Assistant", "GHAS", "CI/CD".
For a hyphenated compound, case each part on its own by same rule, so only a part that is a name keeps its capital: "Self-hosted runners", "Post-migration cleanup", "GAP-provided runners".
When a term has an established product spelling, that spelling wins over the rule.

## Structure

Start with real content — first heading or first sentence.
Skip meta-intros that announce what page covers ("This guide describes…", "In this section we will…"); title already says it, and reader wants content.

Keep each page focused on one reader task or one topic.
Make each section understandable on own, without knowledge from later section — no forward references.
If section only makes sense after reading something below it, restructure so order matches how reader moves through it.

Refactor, merge, move, or rewrite existing text before adding new text.
When section grows misshapen, fix its shape then — do not append another rule to nearest bullet list and leave mess for later.
Move misplaced content to page that owns it instead of linking around bad structure.

## One home per fact

Give every fact exactly one canonical home, and link to it from anywhere else that needs it.
When fact changes, it changes in exactly one place.

Do not repeat fact on another page to warn, emphasize, tease, or summarize — name topic and link to its home.
Restate fact outside its home only when reader must have literal value in hand to do step in front of them, then keep it to value itself plus link.

Cross-reference with full file path, such as `[Development setup](./CONTRIBUTING.md)`.
Add section anchor if cross-reference is to specific section, such as `[Development setup](./CONTRIBUTING.md#development-setup)`.
Same-file anchors such as `[Development setup](#development-setup)` fine for in-page navigation.
Never use bare section reference such as "see the Section section" — breaks as soon as heading moves or renamed.
