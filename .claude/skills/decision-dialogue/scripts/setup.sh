#!/usr/bin/env bash
set -euo pipefail
export LC_ALL=C

task=$(printf '%s' "$*" | sed -E 's/([a-z0-9])([A-Z])/\1-\2/g' | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g')
if [[ -z $task ]]; then
  echo "usage: setup.sh <task title>" >&2
  exit 2
fi

planning="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")/docs/planning"

last=0
for existing in "$planning"/[0-9][0-9][0-9][0-9]-*/; do
  [[ -d $existing ]] || continue
  name=$(basename "$existing")
  if [[ ${name#*-} == "$task" ]]; then
    echo "task name '$task' already exists as docs/planning/$name; task names must be unique" >&2
    exit 1
  fi
  number=$((10#${name%%-*}))
  last=$((number > last ? number : last))
done

mkdir -p "$planning"

ignore="$planning/.gitignore"
touch "$ignore"
if ! grep -qxF '*' "$ignore"; then
  { echo '*'; cat "$ignore"; } > "$ignore.tmp"
  mv "$ignore.tmp" "$ignore"
fi

dir="$planning/$(printf '%04d' $((last + 1)))-$task"
mkdir "$dir"
for file in GOAL INVENTORY QUESTIONS DECISIONS PLAN; do
  sed -e "s|{{date}}|$(date +%F)|" -e "s|{{branch}}|$(git branch --show-current)|" -e "s|{{commit}}|$(git rev-parse --short HEAD)|" \
    "$(dirname "$0")/../templates/$file.md" > "$dir/$file.md"
done
echo "$dir"
