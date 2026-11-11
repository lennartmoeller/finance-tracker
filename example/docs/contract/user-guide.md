# User guide

You ask Census a question with one SQL `SELECT`, and it answers with the matching rows from its database.
The data mirrors GitHub and is not real time: every row says how old it is, as [Freshness of the data](./data-model.md#freshness-of-the-data) describes.

## Send a query

Census has no authentication and is reachable only inside the cluster, so a workload or runner there sends the query.
Every stage cluster, `dev` and `prod`, runs its own Census with its own database, and a caller uses the one of its own stage.
The examples read the address from `census_url`:

```bash
stage=prod
census_url=http://census.acc090-github-global-$stage-def.svc.cluster.local/query
```

Send the query:

```bash
sql="select organization, count(*) as repositories from repositories where organization = 'ggp' group by 1"
body=$(jq -n --arg sql "$sql" '{$sql}')
response=$(curl -sS --fail-with-body --json "$body" "$census_url")
echo "$response" | jq '.rows'
```

Or with a function that wraps the query in a convenient way:

```bash
cq() {
  local response
  response=$(curl -sS --fail-with-body --json "$(jq -n --arg sql "$1" '{$sql}')" "$census_url") \
    || { echo "$response" >&2; return 1; }
  jq '.rows' <<< "$response"
}

cq "select organization, count(*) as repositories from repositories where organization = 'ggp' group by 1"
```

## Query from a workflow

A workflow sends a query with the action [`query`](../.github/actions/query/action.yml) on a runner of the stage whose Census it asks, as [Send a query](#send-a-query) describes.
The action posts the SQL to `<base-url>/query` and returns the rows as the compact JSON array `rows`.
It never sets `allow_stale`, and any error answer, including a stale one, fails the step with the answer of Census as the error.
GitHub limits a step output to about 1 MB, so the action suits small answers.
The Actions access setting of this repository must allow the calling repository.

```yaml
- name: Read the organizations
  id: census
  uses: hg-ggp/census/.github/actions/query@<sha>
  with:
    base-url: http://census.acc090-github-global-prod-def.svc.cluster.local
    sql: select slug from organizations order by 1

- name: Count the organizations
  env:
    ROWS: ${{ steps.census.outputs.rows }}
  run: jq length <<<"$ROWS"
```

## Inputs

### `allow_stale`

Whether to allow reading stale rows.
If `allow_stale` is `false` and there are stale rows, the query returns `503`.
If `allow_stale` is `true`, the query returns the rows even if they are stale.
Defaults to `false`.

Example:

```bash
sql="select organization, count(*) as repositories from repositories where organization = 'ggp' group by 1"
body=$(jq -n --arg sql "$sql" --argjson allow_stale true '{$sql, $allow_stale}')
response=$(curl -sS --fail-with-body --json "$body" "$census_url")
echo "$response" | jq '.rows'
```

## Responses

### Success

A successful response answers with `200` and a JSON object that holds the rows:

```json
{
  "rows": [
    {
      "organization": "ggp",
      "repositories": 25
    }
  ]
}
```

### Error

An error response answers with a status code, and `400` and `503` come with a JSON object that holds the detail as text:

```json
{
  "detail": "syntax error at or near \"grop\""
}
```

| Status | Cause |
|---|---|
| `400` | The SQL contains an error, selects no columns, takes longer than 5 seconds or returns more than 10,000 rows or 32 MiB. |
| `422` | The body is not a JSON object with a text `sql` and, when given, a boolean `allow_stale`, and `detail` is a list that names the field. |
| `500` | Census failed to answer, and the body is the plain text `Internal Server Error`. |
| `503` | The query reads a row that is older than its limit, as [Freshness of the data](./data-model.md#freshness-of-the-data) describes. |
