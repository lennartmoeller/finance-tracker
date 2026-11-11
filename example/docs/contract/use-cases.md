# Use cases

## Overview

Including data into Census comes with a cost in terms of API calls, storage, and freshness.
Each of the datasets included in Census must justify its cost by meeting at least one of the following criteria:

- F1: More than one consumer needs the data, so collecting it once and offering it through the API is cheaper than collecting it separately for each consumer.
- F2: Security and compliance need the data through an API, and Census is that API.
- F3: Other consumers request data and data comes free with it.
  Storing and offering it through the API does not incur additional cost.
- F4: Identities as GitHub Apps can be reduced by offering the data through Census.
- F5: Implementation and maintenance effort drops, as Census handles fetching the data in a reliable and efficient way.

The table rates each use case per criterion with `●` for a clear gain, `○` for a weak or conditional one and `–` for none.

| Tag | Use case | Reads | F1 | F2 | F3 | F4 | F5 |
|:-:|---|---|:-:|:-:|:-:|:-:|:-:|
| C1 | [Read the organizations with their access management mode and TEAMSys applications](#c1-read-the-organizations-with-their-access-management-mode-and-teamsys-applications) | `organizations`<br>`organization_settings`<br>`team_sys_apps` | ● | – | ● | – | ● |
| C2 | [Build one documentation site per publication](#c2-build-one-documentation-site-per-publication) | `docs` | – | – | ● | – | ○ |
| C3 | [Read the members of the Owner Teams of the organizations](#c3-read-the-members-of-the-owner-teams-of-the-organizations) | `organizations`<br>`team_members` | ● | – | – | ● | ● |
| C4 | [Read the current members of the platform member Teams](#c4-read-the-current-members-of-the-platform-member-teams) | `enterprise_team_members`<br>`team_members` | ● | – | – | ● | ● |
| C5 | [Read the Teams and their members for the organization access converge](#c5-read-the-teams-and-their-members-for-the-organization-access-converge) | `teams`<br>`team_members`<br>`enterprise_team_organizations`<br>`enterprise_team_members` | ● | – | – | ● | ● |
| C6 | [Keep the `cinum` topics of the repositories equal to their TEAMSys applications](#c6-keep-the-cinum-topics-of-the-repositories-equal-to-their-teamsys-applications) | `repositories`<br>`team_sys_app_repositories` | ● | ● | ○ | – | ● |
| C7 | [Query the security and compliance data of the repositories](#c7-query-the-security-and-compliance-data-of-the-repositories) | `repositories`<br>`team_sys_app_repositories`<br>`repository_security`<br>`repository_languages`<br>`repository_sboms` | ● | ● | ○ | – | ● |
| C8 | [Dispatch workflows on their schedules](#c8-dispatch-workflows-on-their-schedules) | `workflow_schedules` | ○ | – | ● | – | ● |
| C9 | [Update the consumers of the Workflow Library components](#c9-update-the-consumers-of-the-workflow-library-components) | `workflow_usages` | ○ | – | ● | – | ● |
| C10 | [Check that the repositories an App installation names exist](#c10-check-that-the-repositories-an-app-installation-names-exist) | `repositories` | ● | – | ● | ● | ○ |

### Data

| Table | Use cases |
|---|---|
| `docs` | [C2](#c2-build-one-documentation-site-per-publication) |
| `enterprise_team_members` | [C4](#c4-read-the-current-members-of-the-platform-member-teams), [C5](#c5-read-the-teams-and-their-members-for-the-organization-access-converge) |
| `enterprise_team_organizations` | [C5](#c5-read-the-teams-and-their-members-for-the-organization-access-converge) |
| `enterprise_teams` | – |
| `organization_settings` | [C1](#c1-read-the-organizations-with-their-access-management-mode-and-teamsys-applications) |
| `organizations` | [C1](#c1-read-the-organizations-with-their-access-management-mode-and-teamsys-applications), [C3](#c3-read-the-members-of-the-owner-teams-of-the-organizations) |
| `repositories` | [C6](#c6-keep-the-cinum-topics-of-the-repositories-equal-to-their-teamsys-applications), [C7](#c7-query-the-security-and-compliance-data-of-the-repositories), [C10](#c10-check-that-the-repositories-an-app-installation-names-exist) |
| `repository_languages` | [C7](#c7-query-the-security-and-compliance-data-of-the-repositories) |
| `repository_sboms` | [C7](#c7-query-the-security-and-compliance-data-of-the-repositories) |
| `repository_security` | [C7](#c7-query-the-security-and-compliance-data-of-the-repositories) |
| `state` | – |
| `team_members` | [C3](#c3-read-the-members-of-the-owner-teams-of-the-organizations), [C4](#c4-read-the-current-members-of-the-platform-member-teams), [C5](#c5-read-the-teams-and-their-members-for-the-organization-access-converge) |
| `team_sys_app_repositories` | [C6](#c6-keep-the-cinum-topics-of-the-repositories-equal-to-their-teamsys-applications), [C7](#c7-query-the-security-and-compliance-data-of-the-repositories) |
| `team_sys_apps` | [C1](#c1-read-the-organizations-with-their-access-management-mode-and-teamsys-applications) |
| `teams` | [C5](#c5-read-the-teams-and-their-members-for-the-organization-access-converge) |
| `workflow_schedules` | [C8](#c8-dispatch-workflows-on-their-schedules) |
| `workflow_usages` | [C9](#c9-update-the-consumers-of-the-workflow-library-components) |

## Details

### C1: Read the organizations with their access management mode and TEAMSys applications

The consumers are four workflows of `platform-manager` and the workflow scheduler.
All of them read the organization slug, and some read more:

- [`organization-repo-topics-sync.yml`](https://github.com/hg-ggp/platform-manager/blob/main/.github/workflows/organization-repo-topics-sync.yml) and [`ghas-report.yml`](https://github.com/hg-ggp/platform-manager/blob/main/.github/workflows/ghas-report.yml) read the TEAMSys application IDs with their repository patterns.
- [`organization-metadata-sync.yml`](https://github.com/hg-ggp/platform-manager/blob/main/.github/workflows/organization-metadata-sync.yml) reads the TEAMSys application IDs.
- [`organization-access-converge.yml`](https://github.com/hg-ggp/platform-manager/blob/main/.github/workflows/organization-access-converge.yml) reads the access management mode.
- The workflow scheduler of [C8](#c8-dispatch-workflows-on-their-schedules) reads nothing more.

#### Queries

The query returns one row per organization with its access management mode and its TEAMSys applications, each with its ID and repository patterns:

```sql
SELECT o.slug AS organization,
       s.access_management_mode,
       coalesce(
           (SELECT json_agg(
                       json_build_object('id', a.id, 'repos_include', a.repos_include, 'repos_exclude', a.repos_exclude)
                       ORDER BY a.id)
            FROM team_sys_apps a
            WHERE a.organization = o.slug),
           '[]'
       ) AS team_sys_apps
FROM organizations o
JOIN organization_settings s ON s.organization = o.slug
ORDER BY 1
```

#### Replaced and deletable

The query replaces the `platform-manager` command `customers config get`, which reads the customer configuration of every organization from the `customers` repository and which only these consumers call.
Once every caller uses this query, the command can be deleted.

### C2: Build one documentation site per publication

The consumer is the builder of the documentation hub, a CronJob that runs every 10 minutes in the DEV and PROD clusters.
It builds and serves one site per publication that customers declare in the `docs:` entries of their configuration in `hg-ggp/customers`.

#### Queries

The query returns every publication with the fields of the hub's `Tenant` model and the organization that owns it:

```sql
SELECT organization, slug, description, repo, folder, ref, title, unlisted, exclude_tags
FROM docs
ORDER BY 1, 2
```

#### Replaced and deletable

The query replaces the first stage of the builder, which reads every customer's `docs:` entries with a partial `git fetch` of `main` of `customers`, a tree listing and the config files whose object ID changed, and parses them itself.
Once the builder uses this query, that read of `customers`, the caching by object ID and the YAML parsing of the configs can be deleted.

### C3: Read the members of the Owner Teams of the organizations

The consumers read the members of the Owner Team `hg-<slug>-owner` of an organization:

- The workflow [`pr-policy-gate.yml`](https://github.com/hg-ggp/customers/blob/main/.github/workflows/pr-policy-gate.yml) of `customers` reads the members with this query and passes them as `team-members` to the action [`pr-policy-gate`](https://github.com/hg-ggp/pr-policy-gate), which counts the approvals of Teams: `customers` requires the Owner Team of an organization for a change to that organization's folder and `hg-ggp-owner` for platform files.
- The workflow [`refresh-migration-survey-data.yml`](https://github.com/hg-ggp/migration-survey/blob/main/.github/workflows/refresh-migration-survey-data.yml) of `migration-survey` reads the owners of all organizations, because the survey asks them about the migration status of their organizations.

#### Queries

The query returns the members of the Owner Team of every organization, and an organization without members with no `login`, so that every organization is listed:

```sql
SELECT o.slug AS organization, m.login
FROM organizations o
LEFT JOIN team_members m ON m.organization = o.slug AND m.team = 'hg-' || o.slug || '-owner'
ORDER BY 1, 2
```

#### Replaced and deletable

The query replaced the `platform-manager` command `github team memberships get`, which told which of the given logins are members of the given Teams, and the requester check of `customers` that called it; both are deleted.
It replaces the lookup App `hg-ggp-pr-policy-gate-members-app` as well, which the gate no longer uses, whose configuration is removed from `customers` and which still holds the Members permission in every organization, and the owner reads of the survey refresh with the Members permission of its App token.
The lookup App can be deleted, and once the survey refresh uses this query, so can, in the survey refresh, the action `read-github-organization-owner-logins`, its Members permission and the `organizations` command with its read of `customers`.

### C4: Read the current members of the platform member Teams

The consumer is the `platform-manager` workflow [`organization-member-teams-sync.yml`](https://github.com/hg-ggp/platform-manager/blob/main/.github/workflows/organization-member-teams-sync.yml), which runs the command `github team members sync` to converge the enterprise Teams `hg-internal-employees` and `hg-all` and the organization Team `hg-gh-lib-contributor` of `gh-lib` to the members of the Entra groups.
The sync needs the current members of these three Teams to add the missing and remove the surplus ones.

#### Queries

The query returns the current members of these three Teams:

```sql
SELECT team, login
FROM enterprise_team_members
WHERE team IN ('hg-internal-employees', 'hg-all')
UNION ALL
SELECT team, login
FROM team_members
WHERE organization = 'gh-lib' AND team = 'hg-gh-lib-contributor'
ORDER BY 1, 2
```

#### Replaced and deletable

The query replaces the reads of the current members in the command, which lists them from GitHub.
Once the command uses this query, these reads can be deleted.

### C5: Read the Teams and their members for the organization access converge

The consumer is the `platform-manager` workflow [`organization-access-converge.yml`](https://github.com/hg-ggp/platform-manager/blob/main/.github/workflows/organization-access-converge.yml), which converges the access of every organization with the command `github org access converge`.
In `enterprise` mode the converge deletes the unmanaged Teams of an organization, and in every mode it removes each member that no Team attached to the organization grants.
So it needs the Teams of the organization with their members, and the enterprise Teams that are attached to the organization with their members.
The organization list and the access management mode come from the query of [C1](#c1-read-the-organizations-with-their-access-management-mode-and-teamsys-applications).

#### Queries

Three queries return the Teams of every organization with their direct members, the organizations that each enterprise Team is attached to and the members of each enterprise Team.
The last two are separate, because joining them would exceed the [row cap of a query](../census/core/api.py):

```sql
SELECT t.organization, t.slug AS team, m.login
FROM teams t
LEFT JOIN team_members m ON m.organization = t.organization AND m.team = t.slug
ORDER BY 1, 2, 3
```

```sql
SELECT team, organization
FROM enterprise_team_organizations
ORDER BY 1, 2
```

```sql
SELECT team, login
FROM enterprise_team_members
ORDER BY 1, 2
```

#### Replaced and deletable

The queries replace the reads of the Teams and their members in the command, which lists the Teams of every organization and reads the members of every attached enterprise Team once per organization.
Once the workflow uses these queries, these reads can be deleted from the command.

### C6: Keep the `cinum` topics of the repositories equal to their TEAMSys applications

The consumer is the `platform-manager` workflow [`organization-repo-topics-sync.yml`](https://github.com/hg-ggp/platform-manager/blob/main/.github/workflows/organization-repo-topics-sync.yml), which keeps the `cinum` topics of every repository equal to the TEAMSys applications that select the repository.

#### Queries

The query returns the repositories that are neither archived, disabled nor forks and whose `cinum` topics differ from the ones their TEAMSys applications give:

```sql
SELECT r.organization, r.name AS repository, r.topics, c.current_cinums, c.target_cinums
FROM repositories r,
LATERAL (
    SELECT ARRAY(SELECT t FROM unnest(r.topics) t WHERE t ~ '^cinum[0-9]{8}$' ORDER BY t) AS current_cinums,
           ARRAY(SELECT lower(team_sys_app) FROM team_sys_app_repositories
                 WHERE organization = r.organization AND repository = r.name ORDER BY 1) AS target_cinums
) c
WHERE NOT (r.archived OR r.disabled OR r.fork) AND c.current_cinums <> c.target_cinums
ORDER BY 1, 2
```

For each returned repository, the workflow makes one GitHub call that replaces the full topic set, which is `topics` with `current_cinums` swapped for `target_cinums`.

#### Replaced and deletable

The query replaces the repository listing and the pattern matching of the workflow, which reads all repositories of each organization with their topics from GitHub and matches the repository patterns itself.
Once the workflow uses this query, the repository listing and the pattern matching of `platform-manager` can be deleted.

### C7: Query the security and compliance data of the repositories

The consumers are the security and compliance people.
They get access to the API and query the data on their own: the organizations and repositories, the assignments of TEAMSys applications to the repositories, their security settings, their language composition and their SBOMs.

#### Queries

To list the repositories with their TEAMSys applications, security settings and languages, they can use the following query:

```sql
SELECT r.organization,
       r.name AS repository,
       a.team_sys_apps,
       s.secret_scanning_enabled,
       s.code_security_enabled,
       s.codeql_setup,
       s.codeql_setup <> 'none' AS codeql_enabled,
       s.dependabot_alerts_enabled,
       s.dependabot_security_updates_enabled,
       l.languages
FROM repositories r
CROSS JOIN LATERAL (
    SELECT array_agg(team_sys_app ORDER BY team_sys_app) AS team_sys_apps
    FROM team_sys_app_repositories
    WHERE organization = r.organization AND repository = r.name
) a
LEFT JOIN repository_security s ON s.organization = r.organization AND s.repository = r.name
LEFT JOIN LATERAL (
    SELECT json_object_agg(language, share ORDER BY share DESC, language) AS languages
    FROM (
        SELECT language, round(100.0 * size / sum(size) OVER (), 1) AS share
        FROM repository_languages
        WHERE organization = r.organization AND repository = r.name
    ) shares
) l ON true
WHERE NOT (r.archived OR r.disabled) AND r.name <> 'admin' AND a.team_sys_apps IS NOT NULL
ORDER BY 1, 2
```

To get the SBOMs, they can use the following query:

```sql
SELECT content
FROM repository_sboms
WHERE organization = 'ggp' AND repository = 'platform-manager'
```

The query returns the SBOM of one repository, because the API refuses a result above its [size cap](../census/core/api.py) with `400`.
Fetch one SBOM per query, and fetch many repositories with one query each, one after another.
Only a repository that has an SBOM has a row, and [GitHub has none for many repositories](../context/storage.md#the-sbom-of-every-repository-is-stored-as-text-and-served-through-post-query).

#### Replaced and deletable

This replaces the `platform-manager` workflow [`ghas-report.yml`](https://github.com/hg-ggp/platform-manager/blob/main/.github/workflows/ghas-report.yml), which lists the repositories of every organization with the command `github org repo list` and reads the flags of each repository with the command `github repo ghas get`.
Once the report comes from this query, the workflow and both commands, which only it calls, can be deleted.

### C8: Dispatch workflows on their schedules

The consumer is the workflow scheduler, in `dev/gwc-1/def/workflow-scheduler/files/platform_manager_cli.py` of `deployment-acc090-github-global`, which dispatches a workflow at the cron expression of its `# workflow-schedule:` comment, where GitHub's native cron is too coarse.
It reads the repository, the workflow file, the ref to dispatch on and the cron expression of each schedule.

#### Queries

The query returns these for all organizations, with `default_branch` as the ref to dispatch on:

```sql
SELECT organization, repository, workflow, default_branch, cron
FROM workflow_schedules
ORDER BY 1, 2, 3, 5
```

#### Replaced and deletable

The query replaces the `platform-manager` command `github org workflow schedule list`, which lists the schedules of one organization from the workflow files of its repositories and which only the workflow scheduler calls.
Once every caller uses this query, the command can be deleted.

### C9: Update the consumers of the Workflow Library components

The consumer is the workflow [`scan-usages-and-update-consumers.yml`](https://github.com/hg-gh-lib/registry/blob/main/.github/workflows/scan-usages-and-update-consumers.yml) of `hg-gh-lib/registry`, which runs on weekdays at 04:00 UTC.
It records which repositories use which Workflow Library components, which are reusable actions and workflows, and which approved external actions, at which version, and it opens pull requests that update them.
It will be rebuilt at some day, and feature parity with today's workflow is not a goal.

#### Queries

The rebuilt workflow reads all usages with this query:

```sql
SELECT organization, repository, path, line, component, ref, opted_out
FROM workflow_usages
```

These queries count the usages per component and ref, and per component:

```sql
SELECT component, ref, count(*)
FROM workflow_usages
GROUP BY component, ref
ORDER BY count DESC
```

```sql
SELECT component, count(*)
FROM workflow_usages
GROUP BY component
ORDER BY count DESC
```

#### Replaced and deletable

The queries replace the scan of the registry, which reads every repository over REST with several calls for the ref, the trees and one blob per file, and parses the `uses:` lines itself.
Once the rebuilt workflow uses them, the scan, the parser and the repository listing of the registry can be deleted.

### C10: Check that the repositories an App installation names exist

The consumer is the action [`app-repositories`](https://github.com/hg-ggp/customers/blob/main/.github/actions/app-repositories/action.yml) of `customers`, which the workflow [`configuration-validation.yml`](https://github.com/hg-ggp/customers/blob/main/.github/workflows/configuration-validation.yml) runs on every pull request that changes an organization configuration.
An App entry under `apps.installed` can name the `repositories` the App is limited to, and the action records a finding for each named repository that does not exist.

#### Queries

The action collects the `(organization, repository)` pairs that the changed entries name and sends them in one query, which returns the pairs that Census has; every pair that is not returned is missing:

```sql
SELECT organization, lower(name) AS name
FROM repositories
WHERE (organization, lower(name)) IN (('contract', 'some-repository'), ('gap', 'another-repository'))
```

The names are compared in lower case, because GitHub treats repository names case-insensitively, and a name that GitHub cannot hold stays out of the query and is reported as missing.
Census collects `repositories` every 300 seconds at most, so a repository created in the last minutes can be reported as missing until the check runs again.

#### Replaced and deletable

The query replaced the first version of the check, which minted a token per changed organization and listed its repositories with the command `github org repo list` of `platform-manager`.
That version never reached `main`, so nothing is left to delete, and the pull request job holds no credential for it.
