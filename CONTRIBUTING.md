# Contributing

## Local setup

1. Install the Node.js version in [`.nvmrc`](./.nvmrc), for example with `nvm install` or `fnm install`.
2. Install pnpm with `npm install --global pnpm`; any pnpm version switches itself to the one pinned in the `packageManager` field of [`package.json`](./package.json).
3. Run `pnpm install`.
4. Install each Claude Code plugin enabled in [`.claude/settings.json`](./.claude/settings.json) with `claude plugin install <plugin>@<marketplace> --scope project`, because Claude Code enables these plugins for every clone but does not download them.

## Add a workspace

Each app under `apps/` and each shared package under `packages/` is a pnpm workspace, laid out as the [architecture](./docs/architecture.md#repository-layout) describes.
The first change of a component creates its directory with:

- a `package.json` with `"name": "@finance-tracker/<directory>"`, `"private": true` and `"type": "module"`;
- a `tsconfig.json` that extends `../../tsconfig.base.json`, sets the module resolution, `lib`, `jsx` and `types` its runtime needs, and includes every TypeScript file of the workspace, config files too, because type-aware linting rejects TypeScript files outside every `tsconfig.json`.

Depend on a shared package with `"@finance-tracker/<package>": "workspace:*"`.
Add an external dependency with `pnpm add --filter @finance-tracker/<directory> <dependency>`, which pins its exact version.
Name test files `*.test.ts` or `*.test.tsx`.

## Check a change

Run `pnpm check`, the quality gate; the [`CI` workflow](./.github/workflows/ci.yml) runs the same command and a CodeQL analysis.

- Fix formatting with `pnpm exec prettier --write .` and autofixable lint findings with `pnpm exec eslint --fix .`.
- Delete what knip reports as unused instead of ignoring it.
- Prettier leaves Markdown alone; Markdown follows the [`markdown-authoring` skill](./.claude/skills/markdown-authoring/SKILL.md).
- The change that adds the first test removes `--passWithNoTests` from the `check` script.

## Dependency updates

[Dependabot](./.github/dependabot.yml) opens the update pull requests and holds every ignored version with its reason.
Update Node.js in `.nvmrc` and pnpm in the `packageManager` field of `package.json` by hand, because Dependabot does not track them.
Claude Code updates the plugins enabled in `.claude/settings.json` itself, because a project cannot pin plugin versions.
