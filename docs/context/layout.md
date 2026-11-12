# Layout

## All implementation lives in `src/`, one folder per package

**Id:** 8841fb4c-d06f-4177-9783-d323cfe6fbe0
**Type:** decision
**Status:** active
**Evidence:** inferred
**Source:** the maintainer's review of the empty-house rewrite on 2026-11-12 asked for one root folder that holds all implementation; the flat package folders inside it are the coding agent's design, not yet confirmed by the maintainer
**See:** banks.md#every-bank-is-one-folder-that-the-apps-discover — d2f8114b-dd33-47e2-bbf3-8f54bf4bff7e — as of 2026-11-12

The repository root holds configuration and documentation, and `src/` holds all implementation, one folder per workspace package: `backend`, `banks`, `browser-extension`, `frontend` and `shared`, each with its files directly inside it.

**Reason:** the maintainer wants the implementation in one root folder with folders inside it that structure it, and flat package folders keep the workspace one pattern, every package at the same depth and `src` one meaning.

**Rejected alternative:** `apps/`, `banks/` and `shared/` at the repository root, the rewrite's first layout, which spreads the implementation over three root folders.

**Rejected alternative:** the three apps grouped under `src/apps/`, which sets the apps apart from banks and shared code, but needs a second workspace pattern and puts packages at two depths.

**Rejected alternative:** a `src/` folder inside each app, the bundlers' convention, which makes `src` name two things.

## All shared code lives in `src/shared/`

**Id:** b8623bb6-373c-4886-b85a-48e719e5b52c
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** the maintainer's review of the empty-house rewrite on 2026-11-12
**See:** banks.md#every-bank-is-one-folder-that-the-apps-discover — d2f8114b-dd33-47e2-bbf3-8f54bf4bff7e — as of 2026-11-12

Code that two or more packages or banks use lives in `src/shared/`, the discovery and identity of banks and the helpers banks read their exports with included, so `src/banks/` holds only one folder per bank.

**Reason:** the maintainer wants one place for shared code instead of two.

**Rejected alternative:** the banks' shared helpers, their discovery and their identity at the top of `src/banks/`, kept apart from `src/shared/` because they need Node's or the extension's APIs, which the type check of each importing app already guards, while shared code sat in two places.

**Consequence:** the type check of `src/shared/` carries Node's and the extension's types, so a module there that runs in one app only is caught by the type check of the app that imports it.

**Consequence:** no app imports the banks package by name, so the backend image's install names it to get the bank folders' dependencies.
