---
name: workflow-authoring
description: Author and edit GitHub Actions workflows, reusable actions, and reusable workflows.
---

# Workflow authoring

Always strictly follow these rules when authoring or editing workflows, reusable actions, and reusable workflows.

## Runners

Run every GitHub Actions job on the self-hosted runner for its stage:
- DEV: `gap-acc090-dev-gwc-4gb`.
- UAT: `gap-acc090-uat-gwc-4gb`.
- PROD: `gap-acc090-prod-gwc-4gb`.

## Shell programs

Split Bash work into the smallest useful workflow or action steps instead of hiding multi-purpose logic in an external script.
Implement behavior shared across workflows as a reusable action rather than an external script.
Start every Bash script with `set -euo pipefail`.

## Action versions

Pin every remote GitHub Action and reusable workflow to its full immutable commit SHA.
Include a release-version comment when one exists.
Reference local actions and reusable workflows by their `./` paths.
