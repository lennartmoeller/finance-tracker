# Hosting

```mermaid
flowchart LR
  subgraph machine["The user's machine"]
    subgraph compose["Docker Compose"]
      migrate["Migrate container,<br/>the backend's image,<br/>done before the backend starts"]
      backend["Backend container"]
      postgres[("PostgreSQL container,<br/>data in a volume")]
    end
    extension["Browser extension in Firefox"]
    vite["Frontend dev server"]
    page["Frontend in a browser"]
  end
  migrate -- "pgschema brings the database to schema.sql,<br/>planning in the database pgschema_plan" --> postgres
  extension -- "API_TOKEN entered in the popup" --> backend
  page --> vite
  vite -- "adds API_TOKEN from .env" --> backend
  backend --> postgres
```

Compose publishes PostgreSQL and the backend on `127.0.0.1` only, and the backend answers only requests that carry `API_TOKEN` as bearer token.

Any other deployment, such as a Kubernetes cluster, runs the migrate step from the backend's image to completion before the backend starts, as an init container of a single backend pod or as a job before the rollout, never twice at once, with a database role allowed to create `pgschema_plan`.
