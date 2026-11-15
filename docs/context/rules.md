# Rules

## Brands and categories follow from rules, not from labels

**Id:** 8232f188-5501-4252-8d44-17b2f41076bb
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** maintainer decisions of 2026-11-13, in the planning Q&A and the mockup rounds of the Rules view

A cash transaction's brand and category follow from rules: each rule holds a counterparty pattern, a description pattern or both, and a category's rule may also require a brand, such as "brand Amazon and description `prime video`".
A brand carries no category; a category's rule names the brand instead.

**Reason:** the maintainer keeps a few rules instead of labelling thousands of transactions, and a new or changed rule applies to the whole history at once.

**Reason:** brands and categories work one way, so a brand can follow from the description too, such as DAZN from PayPal's "Ihr Einkauf bei DAZN", which one counterparty pattern per brand could not see.

**Rejected alternative:** a label per transaction, set by hand.

**Rejected alternative:** one counterparty pattern per brand, chosen earlier in issue #22 because alternation lets one pattern cover every variant; it cannot see the merchant behind a payment intermediary.

**Rejected alternative:** a brand that names its category beside the categories' own rules, which needs a precedence between the two sources; and categories by their own patterns only, which writes every branded merchant's pattern twice.

**Consequence:** each categorised brand takes a rule of its own in its category.

## The rule with the most conditions wins, then the oldest

**Id:** daa68fab-5937-462f-9c6f-8ac0b1e2b064
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** maintainer decision of 2026-11-13, against the agent's recommendation of an order set by the user
**See:** rules.md#brands-and-categories-follow-from-rules-not-from-labels — 8232f188-5501-4252-8d44-17b2f41076bb — as of 2026-11-13

Among the matching rules, the one with the most conditions, counting a required brand, a counterparty pattern and a description pattern, gives the brand or category, and among equally specific rules the oldest; brands and categories follow the same precedence.

**Reason:** an exception is almost always a rule with more conditions, so it wins without any ordering in the view, whenever it was created.

**Rejected alternative:** an order of categories the user sets, explicit but costing a position column, reorder controls and a second precedence for brands.

**Rejected alternative:** creation order alone, under which an exception added after its general rule never wins.

**Consequence:** a tie between equally specific rules goes to the older one, which the view does not show; the user resolves it by adding a condition or narrowing a pattern.

## Matching stays in PostgreSQL

**Id:** 2e7be9c1-435b-4aef-97ca-6ae4c93a6b6c
**Type:** decision
**Status:** superseded
**Evidence:** confirmed
**Source:** issue #34; maintainer decision of 2026-11-13
**Revisit when:** the frontend needs to preview a pattern's matches while it is typed
**See:** rules.md#brands-and-categories-follow-from-rules-not-from-labels — 8232f188-5501-4252-8d44-17b2f41076bb — as of 2026-11-13
**Superseded by:** 45904d9b-c90f-430b-bcfb-7ed7377067b5

`transaction.list` matches every cash transaction against the rules in PostgreSQL with `~*` on each read, and the frontend shows what a saved rule matches after reloading.

**Reason:** issue #34 chose PostgreSQL because brands were inserted by hand with no procedure to validate them; now that the frontend saves patterns through procedures, what still holds is that the database validates the dialect it matches with, and the stored patterns use its syntax, such as `\m` and `\M`, which JavaScript's `RegExp` does not know.

**Rejected alternative:** matching in TypeScript in the shared package, which gives a free preview but means rewriting the stored patterns and losing the database's pattern check.

**Rejected alternative:** a procedure that previews a draft's matches while typing, one more procedure and form wiring, which can still come later without rework.

**Consequence:** the user sees a pattern's effect only after saving it.

## Rules match in PostgreSQL, and the frontend reads their dialect through a translation

**Id:** 45904d9b-c90f-430b-bcfb-7ed7377067b5
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** issue #54; maintainer decisions of 2026-11-14 and 2026-11-15 in the experiment and planning behind it
**Revisit when:** the database's locale or PostgreSQL's regular-expression engine changes, or a stored pattern uses syntax the translation refuses
**See:** rules.md#matching-stays-in-postgresql — 2e7be9c1-435b-4aef-97ca-6ae4c93a6b6c — as of 2026-11-15

`transaction.list` keeps matching every cash transaction against the rules in PostgreSQL with `~*`, which validates every stored pattern, while the frontend reads the same dialect through `src/frontend/pattern.ts`, a one-way translation into JavaScript's `RegExp`, for the Transactions view's filters, the Rules editor's live match count and the mock mode.
What the user types is what is stored, and every pattern, in a rule or a filter, is written in PostgreSQL's dialect.

**Reason:** the filters and the live count match while the user types, which a round trip per keystroke would slow, and the filters match texts the frontend formats, such as German dates and category paths, which SQL would have to rebuild.

**Reason:** the stored patterns keep their syntax, such as `\m` and `\M`, so nothing is migrated; on the local database on 2026-11-15 the translation matched exactly what `~*` matches for all 63 stored patterns over about 3,000 cash transactions, and for 621 synthetic cases of umlauts at word boundaries, case folding, line breaks, anchors and class escapes, and 900 of braces and brackets, valid and invalid alike.

**Rejected alternative:** filtering or previewing through a PostgreSQL procedure, a round trip per keystroke that rebuilds the frontend's shown texts in SQL.

**Rejected alternative:** JavaScript's own dialect for the filters, in which the stored rules' `\m` and `\M` do not mean word boundaries, so a pattern would not move between a rule and a filter.

**Rejected alternative:** an easier dialect of its own, such as glob wildcards, which is a language with its own parser, converters and documentation, and cannot say whole word, alternation or lookahead, which the stored rules use.

**Rejected alternative:** JavaScript's dialect as what people write, converted to PostgreSQL's for matching, which needs every stored `\m` and `\M` migrated and a converter in the backend, and whose ASCII-only `\b` disagrees with PostgreSQL around umlauts.

**Rejected alternative:** converters between an easier dialect and PostgreSQL's in both directions, which keep two forms of one pattern and lose information on the way back.

**Rejected alternative:** moving rule matching itself into TypeScript, which loses the database's pattern check.

**Consequence:** the translation must keep agreeing with PostgreSQL: it maps `\m`, `\M`, `\y`, `\Y`, `\A` and `\Z`, and `\w`, `\W`, `\s` and `\S` as the database's `en_US.utf8` locale reads them, where JavaScript's `\w` is ASCII-only and its `\s` takes in Unicode spaces; it escapes a `]` first in brackets, a `]` or `}` outside brackets and bounds, and a `{` before a non-digit, which PostgreSQL reads as themselves and JavaScript refuses or ends on, and refuses a bound above 255 as PostgreSQL does; it refuses `\b`, a backspace in PostgreSQL, with a hint to `\y`, and refuses POSIX bracket classes, which no stored pattern uses.

**Consequence:** JavaScript-only syntax that passes the translation, such as `\p{L}`, works in a filter and the live count while PostgreSQL refuses it on save, and a pattern the translation refuses still reaches PostgreSQL on save, which decides whether it is stored.

**Consequence:** the Rules editor shows how many transactions each rule matches while it is typed, counting the rule's conditions without the precedence between rules.

## One lightweight pattern input colours and checks every pattern

**Id:** 53830b93-925e-45da-ade2-b043059f8df5
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** issue #54; maintainer decisions of 2026-11-14 and 2026-11-15, after comparing a Prism input with a CodeMirror editor
**See:** rules.md#rules-match-in-postgresql-and-the-frontend-reads-their-dialect-through-a-translation — 45904d9b-c90f-430b-bcfb-7ed7377067b5 — as of 2026-11-15

The Transactions view's filters and the Rules editor's pattern fields share `PatternInput`: a plain input with transparent text over a layer that Prism colours, its `regex` grammar extended by PostgreSQL's word anchors.
A pattern the translation refuses gets a wavy underline and its message in the input's tooltip, and in the Rules editor a pattern matching the empty string is marked too, as the database refuses it; the Rules list's chips show their patterns in the same colours.

**Reason:** the maintainer wants writing patterns made easy, but not at all costs: a lightweight input with some validation and some colour was judged enough, and Prism with its grammar costs about 9 kB gzipped.

**Reason:** a pattern looks the same in the list and in its editor, and anchors, groups and escapes stand out from literal text.

**Rejected alternative:** a CodeMirror 6 editor with a grammar of its own, autocomplete in plain words, bracket matching and inline error marks, which added 112 kB gzipped to the 223 kB app and slowed opening the Transactions view from about 212 to about 400 ms with 3,430 rows.

**Rejected alternative:** the message shown as red text under a rule in the Rules editor, or in the Transactions view's footer, beside the tooltip.

**Rejected alternative:** monochrome rule chips, colour only where patterns are written.

**Consequence:** pattern syntax joins the frontend's few places for colour, each colour reaching 4.5:1 contrast against every background it sits on, as `src/frontend/CLAUDE.md` requires.

**Consequence:** reading a broken pattern's message takes a hover.

## One rules table for brands and categories

**Id:** 0bafaf52-5da0-4645-9c4b-3bb0a93d43d3
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** maintainer decision of 2026-11-13, choosing the agent's recommendation
**See:** rules.md#brands-and-categories-follow-from-rules-not-from-labels — 8232f188-5501-4252-8d44-17b2f41076bb — as of 2026-11-13

One table `rules` holds every rule, owned by exactly one brand or one category, with a required brand allowed on a category's rule only.

**Reason:** the pattern checks, the matching SQL and the saving of rules exist once, and the maintainer prefers few tables with a per-kind check over a table per kind.

**Rejected alternative:** `brand_rules` and `category_rules`, each with simpler checks but every pattern check, the matching SQL and the saving of rules twice.

## Categories form a tree, and only leaves have rules

**Id:** 3c7999d4-e68e-4b3e-b8e0-41e8f5e938ec
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** maintainer decision of 2026-11-13, against the agent's recommendation of flat categories

A category can have a parent to any depth; only a category without subcategories has rules and so transactions, and triggers refuse a rule on a category with subcategories, a subcategory under a category with rules, and a cycle.

**Reason:** the maintainer groups categories on several levels, such as Streaming › Sport streaming › Sky, and a transaction counting in exactly one leaf keeps every parent's total the sum of its children.

**Rejected alternative:** flat categories, with a parent added once figures by category need it; and a fixed depth of two, which the maintainer's three-level example exceeds.

## A brand or category is saved with its rules in one statement

**Id:** b149dad7-2ec1-4900-aa99-906af01fb51b
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** maintainer decision of 2026-11-13, choosing the agent's recommendation in the mockup rounds
**See:** rules.md#the-rule-with-the-most-conditions-wins-then-the-oldest — daa68fab-5937-462f-9c6f-8ac0b1e2b064 — as of 2026-11-13

The side panel edits an item and all its rules under one Save, and the backend saves them in one statement: rules that keep their id are updated in place, new ones are added in their order, and missing ones are deleted.

**Reason:** a refused save stores nothing, and an existing rule keeps its id and so its age for ties.

**Rejected alternative:** a Save per rule beside the item's own, which crowds the panel and can store half an edit.

## Deleting refuses what would drop rules unseen

**Id:** 97af1712-ba74-49f5-86ad-37d25a0ad186
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** maintainer confirmation of 2026-11-13 of the agent's proposed defaults
**See:** rules.md#categories-form-a-tree-and-only-leaves-have-rules — 3c7999d4-e68e-4b3e-b8e0-41e8f5e938ec — as of 2026-11-13

Deleting a brand that a category's rule requires is refused with the names of those categories, and deleting a category with subcategories is refused; deleting a brand takes its own rules and logo, and deleting a leaf its rules.

**Reason:** a delete never silently drops rules the user wrote for another item.

**Rejected alternative:** deleting the rules that require a brand along with it, and a category's whole subtree along with it.

## Logos follow their brand

**Id:** 430d123a-4fbd-4d7c-9bb7-b2c99e6e547f
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** maintainer confirmation of 2026-11-13 of the agent's proposed defaults; issue #22

`logos.domain` references `brands.domain` and goes with a deleted brand, and changing a brand's domain deletes the old domain's logo in the same statement, so the next read fetches the new one.

**Reason:** brands are now changed and deleted in the frontend, so their logos follow them instead of piling up.

**Rejected alternative:** leaving a deleted brand's or old domain's logo behind, which issue #22 accepted while brands changed only by hand.

## Each brand, category and rule links to the transactions it matches

**Id:** 86e158bc-d6f2-4844-ac9f-5234b8d85379
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** maintainer decisions of 2026-11-15, after comparing three layouts in a mockup and trying the first implementation
**See:** rules.md#the-rule-with-the-most-conditions-wins-then-the-oldest — daa68fab-5937-462f-9c6f-8ac0b1e2b064 — as of 2026-11-15
**See:** apps.md#every-screen-has-an-address-and-every-move-to-another-screen-is-a-link — 80bdd506-5ada-436c-9c9b-ad23c2d7fbe9 — as of 2026-11-15

Each row of the Rules view ends with an icon link to its brand's or category's cash transactions, and in the edit panel each rule's "Matches N transactions" line links to the transactions it counts, both by filling the Transactions view's filters.
A brand's link filters its name exactly, a category's its path exactly and a folder's its path with every path below it, so each lists as many transactions as its row counts; a rule's link fills the counterparty and description filters with its patterns as currently typed and the brand filter with its required brand.
A rule's link lists every transaction its conditions match, also those a rule with more conditions takes, as its count does.

**Reason:** a rule's list then shows how broad the rule is, with the count beside it, and follows an edit before it is saved.

**Reason:** the row's icon link stays in view, as the Accounts view's Transactions action, read as one pattern across views.

**Rejected alternative:** a small icon link at the end of each rule chip in the table, which the maintainer moved into the edit panel after trying it.

**Rejected alternative:** a rule's link limited to the transactions its own brand or category was assigned, whose count can fall below the rule form's.

**Rejected alternative:** the count and the whole chip as links in the table, which add nothing on screen but click differently from the row without showing it; the icon links shown only on the hovered row.

**Consequence:** a plain click on a rule's link leaves the Rules view and with it an unsaved edit in the panel, which a Cmd-click keeps.

## Rules count no transfer side

**Id:** e28b32cf-e8b0-46bd-a1ee-2ce183247abd
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** maintainer decision of 2026-11-15, looking at the real data, which reversed the agent's first choice approved with the plan
**See:** rules.md#each-brand-category-and-rule-links-to-the-transactions-it-matches — 86e158bc-d6f2-4844-ac9f-5234b8d85379 — as of 2026-11-15
**See:** apps.md#a-transfer-shows-as-one-row-when-both-its-sides-are-listed — e90e05d7-b504-4cfc-9973-d19e2b6ddda1 — as of 2026-11-15

A rule's "Matches N transactions" in the Rules editor leaves out the sides of transfers, which get no brand or category, and its link lists none of them, since a transfer side's counterparty and description texts in the Transactions view stay empty.

**Reason:** a rule's count and its link keep listing the same set, which the link builds from the rule's patterns as filters.

**Rejected alternative:** counting transfer sides, as the count counts transactions a more specific rule takes, which shows the rules that now match only transfers, such as the brand Trade Republic's rule on ING's direct debits; it stopped agreeing with the link once transfer rows lost their texts.
