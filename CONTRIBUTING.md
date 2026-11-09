# Contributing

## Local setup

1. Install the Node.js version in [`.nvmrc`](./.nvmrc), for example with `nvm install` or `fnm install`.
2. Install pnpm with `npm install --global pnpm`; any pnpm version switches itself to the one pinned in the `packageManager` field of [`package.json`](./package.json).
3. Run `pnpm install`.

## Add a workspace

Each app under `apps/` and each shared package under `packages/` is a pnpm workspace, laid out as the [architecture](./docs/architecture.md#repository-layout) describes.
The first change of a component creates its directory with:

- a `package.json` with `"name": "@finance-tracker/<directory>"`, `"private": true` and `"type": "module"`;
- a `tsconfig.json` that extends `../../tsconfig.base.json` and sets the module resolution, `lib`, `jsx` and `types` its runtime needs.

Depend on a shared package with `"@finance-tracker/<package>": "workspace:*"`.
Add an external dependency with `pnpm add --filter @finance-tracker/<directory> <dependency>`, which pins its exact version.
Name test files `*.test.ts` or `*.test.tsx`.

## Check a change

Run `pnpm check`, the quality gate; the [`CI` workflow](./.github/workflows/ci.yml) runs the same command and a CodeQL analysis on every pull request to `main` and every push to `main`.

- Fix formatting with `pnpm exec prettier --write .` and autofixable lint findings with `pnpm exec eslint --fix .`.
- Delete what knip reports as unused instead of ignoring it.
- Prettier leaves Markdown alone; Markdown follows the [`markdown-authoring` skill](./.claude/skills/markdown-authoring/SKILL.md).
- The change that adds the first test removes `--passWithNoTests` from the `check` script.

## Dependency updates

Dependabot opens weekly pull requests for npm dependencies and GitHub Actions; versions it ignores, with the reason for each, live in [`.github/dependabot.yml`](./.github/dependabot.yml).
Update Node.js in `.nvmrc` and pnpm in the `packageManager` field of `package.json` by hand, because Dependabot does not track them.
