# Issue tracker: GitHub

Issues and specs for this repository live as GitHub issues.
Use the `gh` CLI for every operation; run inside the clone, it infers the repository from `origin`.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`, with a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --json number,title,body,labels,comments`.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`, with `--label` and `--state` filters as needed.
- **Make an issue a sub-issue of a parent**: `gh issue create --parent <parent> ...`, or `gh issue edit <parent> --add-sub-issue <child>` afterwards.
- **Comment on an issue**: `gh issue comment <number> --body "..."`.
- **Apply or remove labels**: `gh issue edit <number> --add-label "..."` or `--remove-label "..."`.
- **Close an issue**: `gh issue close <number> --comment "..."`.

When a skill says "publish to the issue tracker", create a GitHub issue.
When a skill says "fetch the relevant ticket", read it as an issue.

## Pull requests as a triage surface

**PRs as a request surface: no.**
Set it to `yes` to treat external pull requests as feature requests; `/triage` reads this flag.

When set to `yes`, pull requests run through the same labels and states as issues, using the `gh pr` equivalents:

- **Read a PR**: `gh pr view <number> --comments`, and `gh pr diff <number>` for the diff.
- **List external PRs for triage**: `gh api --paginate 'repos/{owner}/{repo}/pulls?state=open' --jq '.[] | select(.author_association | IN("OWNER","MEMBER","COLLABORATOR") | not) | {number, title, author: .user.login, author_association, labels: [.labels[].name]}'`.
- **Comment, label or close**: `gh pr comment`, `gh pr edit --add-label` or `--remove-label`, and `gh pr close`.

GitHub shares one number space across issues and pull requests, so resolve a bare `#42` with `gh pr view 42` and fall back to `gh issue view 42`.

## Wayfinding operations

`/wayfinder` keeps its **map** as one issue and its tickets as **child** issues.

- **Map**: one issue labelled `wayfinder:map` holding the Notes, Decisions-so-far and Fog body, created with `gh issue create --label wayfinder:map`.
- **Child ticket**: a sub-issue of the map, labelled `wayfinder:<type>` with type `research`, `prototype`, `grilling` or `task`, and assigned to the driving developer once claimed.
- **Blocking**: GitHub's native issue dependencies, added with `gh api --method POST repos/{owner}/{repo}/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`.
  `<blocker-db-id>` is the blocker's database id from `gh api repos/{owner}/{repo}/issues/<n> --jq .id`, not its `#number` or `node_id`.
  `issue_dependencies_summary.blocked_by` counts open blockers only, so a ticket is unblocked once it reaches zero.
- **Frontier query**: list the map's open sub-issues, drop any with an open blocker or an assignee, and take the first in map order.
- **Claim**: `gh issue edit <n> --add-assignee @me`, as the session's first write.
- **Resolve**: `gh issue comment <n> --body "<answer>"`, then `gh issue close <n>`, then append a context pointer with gist and link to the map's Decisions-so-far.
