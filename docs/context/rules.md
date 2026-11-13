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
**Status:** active
**Evidence:** confirmed
**Source:** issue #34; maintainer decision of 2026-11-13
**Revisit when:** the frontend needs to preview a pattern's matches while it is typed
**See:** rules.md#brands-and-categories-follow-from-rules-not-from-labels — 8232f188-5501-4252-8d44-17b2f41076bb — as of 2026-11-13

`transaction.list` matches every cash transaction against the rules in PostgreSQL with `~*` on each read, and the frontend shows what a saved rule matches after reloading.

**Reason:** issue #34 chose PostgreSQL because brands were inserted by hand with no procedure to validate them; now that the frontend saves patterns through procedures, what still holds is that the database validates the dialect it matches with, and the stored patterns use its syntax, such as `\m` and `\M`, which JavaScript's `RegExp` does not know.

**Rejected alternative:** matching in TypeScript in the shared package, which gives a free preview but means rewriting the stored patterns and losing the database's pattern check.

**Rejected alternative:** a procedure that previews a draft's matches while typing, one more procedure and form wiring, which can still come later without rework.

**Consequence:** the user sees a pattern's effect only after saving it.

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
