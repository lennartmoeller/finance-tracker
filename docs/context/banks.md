# Banks

## Every bank is one folder that the apps discover

**Id:** d2f8114b-dd33-47e2-bbf3-8f54bf4bff7e
**Type:** decision
**Status:** active
**Evidence:** inferred
**Source:** the empty-house rewrite of 2026-11-11, designed by the coding agent after the target structure of `.claude/skills/empty-house-refactoring/SKILL.md`; not yet confirmed by the maintainer
**See:** ingestion.md#raw-transactions-read-by-their-account — aef5e287-882f-486e-9b4e-37a23394ddea — as of 2026-11-11

Everything bank-specific lives in the bank's folder under `src/shared/banks/`: its name, logo and account number formats, its raw transaction shapes, the adapter the extension runs and the extraction the backend runs.
The apps find the folders by file name, the frontend and the extension through Vite's `import.meta.glob`, the backend and the extension's manifest through `src/shared/discover.ts` in Node, so no app names a bank.

**Reason:** adding, changing or removing a bank is the change the repository sees most, and it touches one folder instead of a shape file in the shared package, an adapter and its entrypoints in the extension, a case in the backend's extraction, an identity function, a logo map, a ranking list and the manifest's permissions.

**Rejected alternative:** an explicit list of banks per app, which keeps literal bank types and needs no discovery, but makes every bank a change in three lists outside its folder.

**Rejected alternative:** one isomorphic module per bank serving all three apps, which needs one list, but bundles adapters and extractions into the frontend and leaks the extension's and Node's types into every app.

**Consequence:** discovery has two mechanisms, because Vite's glob does not exist in Node and the backend runs its TypeScript in Node without a bundler.

**Consequence:** bank names are plain strings in the API contract, so the backend checks a new account's bank, type and number against the bank's declaration instead of the contract's schema.

**Consequence:** the database schema still lists the banks in two checks, so a new bank needs a schema change as well.

## A bank declares only the account types the extension syncs

**Id:** bc02b8d8-1203-472c-970a-f5651ec803a7
**Type:** decision
**Status:** superseded
**Evidence:** confirmed
**Source:** maintainer decision in a planning dialogue, 2026-11-12, kept for the frontend's add form in a planning dialogue, 2026-11-13
**See:** banks.md#every-bank-is-one-folder-that-the-apps-discover — d2f8114b-dd33-47e2-bbf3-8f54bf4bff7e — as of 2026-11-12
**See:** accounts.md#a-closed-account-is-a-flag-that-takes-it-out-of-syncing — 8dcdf615-992f-404a-a497-99c69d4320f6 — as of 2026-11-14
**Superseded by:** b8532aa7-2bb9-458d-af4b-e094660ae7cf

A bank's `bank.ts` declares only the account types the browser extension syncs, so a bank the extension doesn't sync, such as Sparkasse, declares none and has no `adapter.ts`.
That one rule decides four places: `account.create` accepts only a declared type, the frontend's add form offers only declared types, and the popup lists and the frontend marks with a sync's freshness only accounts of a declared type that are not closed.

**Reason:** a declared type already meant one the extension syncs, as `account.create`'s answer to any other says, so no new field was needed, and an account the extension can't sync shows neither a sync button that fails nor a freshness mark that stays stale.

**Rejected alternative:** Sparkasse declaring a cash account with the IBAN format, plus a new field in `bank.ts` marking banks filled by hand, which lets `account.create` check the IBAN but adds a field for the same effect.

**Rejected alternative:** hiding such an account in the popup only, which leaves the frontend's freshness mark stale for good.

**Consequence:** an account of an undeclared type is inserted into the database by hand, so no app checks its number.

## A bank declares the account types the extension syncs or the user uploads

**Id:** b8532aa7-2bb9-458d-af4b-e094660ae7cf
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** the PayPal plan, confirmed by the maintainer in a planning dialogue, 2026-11-16; the decisions of 2026-11-12 and 2026-11-13 in the entry this one replaces
**See:** banks.md#every-bank-is-one-folder-that-the-apps-discover — d2f8114b-dd33-47e2-bbf3-8f54bf4bff7e — as of 2026-11-16
**See:** ingestion.md#paypal-through-its-uploaded-activity-report — 54552782-c069-4547-9741-12a4dfe832f9 — as of 2026-11-16

A bank's `bank.ts` declares the account types the browser extension syncs or the user uploads, so PayPal, which is only uploaded, declares a cash account with an email address as its number, and Sparkasse, which is neither, declares none.
`account.create` accepts and the frontend's add form offers only declared types, the frontend marks a declared type's open accounts with their last import's freshness, and the popup lists only the accounts of banks with an adapter.

**Reason:** an uploaded account needs `account.create` to check its number, and an upload counts as a sync, so the freshness mark follows uploads too; the popup reads its banks from the adapters, so it never offers a sync for a bank without one.

**Rejected alternative:** a field in `bank.ts` marking banks filled by hand or by upload, which says what the presence of `adapter.ts` and `export-file.ts` already says.

**Consequence:** an account of an undeclared type, such as Sparkasse's, is inserted into the database by hand, so no app checks its number.

**Consequence:** an adapter's account types take only the IBAN and depot number formats, so the popup's add form never meets an email address.

## A shape version widens to accept a value it has not seen

**Id:** 78b90e63-97a6-4f3f-bba5-5f6e7c3d87dc
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** maintainer decision in a planning dialogue, 2026-11-16, when Trade Republic's export delivered an `IPO_SUBSCRIPTION` row
**See:** ingestion.md#raw-transactions-read-by-their-account — aef5e287-882f-486e-9b4e-37a23394ddea — as of 2026-11-16

A changed export structure takes a new shape version, while a shape version may widen in place to accept a value it has not seen, such as a new transaction type, as long as it reads every stored row exactly as before; `src/shared/banks/CLAUDE.md` states the rule.

**Reason:** Trade Republic's structure did not change when its export first carried `IPO_SUBSCRIPTION`, only a value its version 1 did not list yet, as `STOCKPERK` was once added; a version per new value would multiply versions with every type a bank adds.

**Rejected alternative:** a new shape version for every new value, a near-copy of the last one with its own extraction entry, which the rule's earlier wording, never to edit a version that stored rows use, demanded.
