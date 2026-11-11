#!/usr/bin/env bash
set -euo pipefail

worktree=$(git rev-parse --show-toplevel)
main=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")
if [[ $worktree == "$main" ]]; then
  echo "setup-worktree.sh: run it inside a worktree, not in the main checkout" >&2
  exit 2
fi

ln -sf "$main/.env" "$worktree/.env"
cd "$worktree"
pnpm install --frozen-lockfile
