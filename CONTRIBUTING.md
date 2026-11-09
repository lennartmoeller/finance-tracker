# Contributing

## Local setup

1. Install the Node.js version in [`.nvmrc`](./.nvmrc), for example with `nvm install` or `fnm install`.
2. Install pnpm with `npm install --global pnpm`; any pnpm version switches itself to the one pinned in the `packageManager` field of [`package.json`](./package.json).
3. Run `pnpm install`.
4. Install a Docker-compatible container runtime with Compose, such as Docker Desktop, or Colima with the standalone `docker-compose`, which spells this guide's `docker compose` with a hyphen.
5. Create a `.env` in the repository root with `API_TOKEN=<a random secret>` and `DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres`; Compose reads the token from it, and the backend's dev server both values.
6. Install each Claude Code plugin enabled in [`.claude/settings.json`](./.claude/settings.json) with `claude plugin install <plugin>@<marketplace> --scope project`, because Claude Code enables these plugins for every clone but does not download them.

## Run the system

- `docker compose up -d --build` runs PostgreSQL, the backend on <http://localhost:3000> and the frontend on <http://localhost:8080>, as [`compose.yaml`](./compose.yaml) defines them.
- For development, run `docker compose up -d postgres`, then `pnpm --filter @finance-tracker/backend dev` and `pnpm --filter @finance-tracker/frontend dev`, whose Vite server forwards `/rpc` to the backend.
- `pnpm --filter @finance-tracker/extension dev` opens a Firefox with the extension loaded until that Firefox closes.
- The frontend and the extension's popup each ask for the `API_TOKEN` once.

## Add a workspace

Each app under `apps/` and each shared package under `packages/` is a pnpm workspace, laid out as the [architecture](./docs/architecture.md#repository-layout) describes.
The first change of a component creates its directory with:

- a `package.json` with `"name": "@finance-tracker/<directory>"`, `"private": true` and `"type": "module"`;
- a `tsconfig.json` that extends `../../tsconfig.base.json`, sets the module resolution, `lib`, `jsx` and `types` its runtime needs, and includes every TypeScript file of the workspace, config files too, because type-aware linting rejects TypeScript files outside every `tsconfig.json`.

Depend on a shared package with `"@finance-tracker/<package>": "workspace:*"`.
Add an external dependency with `pnpm add --filter @finance-tracker/<directory> <dependency>`, which pins its exact version.
Name test files `*.test.ts` or `*.test.tsx`.

## Change the database schema

Edit [`apps/backend/src/schema.ts`](./apps/backend/src/schema.ts) and run `pnpm --filter @finance-tracker/backend exec drizzle-kit generate --name <change>`; the backend applies new migrations when it starts.

## Check a change

Run `pnpm check`, the quality gate; the [`CI` workflow](./.github/workflows/ci.yml) runs the same command and a CodeQL analysis.
Tests run without a database, so `pnpm check` and CI need no PostgreSQL; skipping known raw transactions rests on the database's unique constraint on account and identity and is checked by hand.

- Fix formatting with `pnpm exec prettier --write .` and autofixable lint findings with `pnpm exec eslint --fix .`.
- Delete what knip reports as unused instead of ignoring it.
- Prettier leaves Markdown alone; Markdown follows the [`markdown-authoring` skill](./.claude/skills/markdown-authoring/SKILL.md).

## Release the extension

Release Firefox installs only add-ons Mozilla signed, so each release is signed as unlisted on addons.mozilla.org, which keeps it private.

1. Raise `version` in [`apps/extension/package.json`](./apps/extension/package.json).
2. Set `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET` to the credentials from addons.mozilla.org's API key page.
3. Run `pnpm --filter @finance-tracker/extension sign`.
4. Open the signed `.xpi` from `apps/extension/.output/signed` in Firefox to install it.

## Dependency updates

[Dependabot](./.github/dependabot.yml) opens the update pull requests and holds every ignored version with its reason.
Update Node.js in `.nvmrc` to the version Dependabot sets in the [`Dockerfile`](./Dockerfile), and pnpm in the `packageManager` field of `package.json`, by hand, because Dependabot tracks neither.
Claude Code updates the plugins enabled in `.claude/settings.json` itself, because a project cannot pin plugin versions.
