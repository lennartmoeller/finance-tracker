# Hosting

The backend answers only requests that carry `API_TOKEN` as bearer token.
The frontend's nginx adds it to every request it forwards to the backend, so whoever reaches the frontend's port reads and changes all data.
The browser extension sends its requests to the address entered in its popup: the frontend's origin, whose nginx replaces the extension's token with its own, or the backend's port with the token entered there.

## Docker Compose on the user's machine, for tests

```mermaid
flowchart LR
  subgraph machine["The user's machine"]
    subgraph compose["Docker Compose"]
      migrate["Migrate container,<br/>the backend's image,<br/>done before the backend starts"]
      backend["Backend container,<br/>127.0.0.1:3000"]
      frontend["Frontend container, nginx,<br/>127.0.0.1:8080"]
      postgres[("PostgreSQL container,<br/>127.0.0.1:5432,<br/>data in a volume")]
    end
    page["Frontend in a browser"]
    extension["Browser extension in Firefox"]
  end
  migrate -- "pgschema brings the database to schema.sql,<br/>planning in the database pgschema_plan" --> postgres
  page --> frontend
  extension -- "/rpc" --> frontend
  frontend -- "/rpc and /logos,<br/>adds API_TOKEN from .env" --> backend
  backend --> postgres
```

During development, the frontend's dev server takes nginx's place and adds the token the same way.

## The K3s cluster of the home network, in production

```mermaid
flowchart LR
  subgraph lan["LAN"]
    page["Frontend in a browser"]
    extension["Browser extension in Firefox"]
  end
  subgraph namespace["The Helm release's namespace"]
    secret[/"Secret finance-tracker:<br/>API_TOKEN, LOGO_DEV_SECRET_KEY,<br/>POSTGRES_PASSWORD"/]
    frontend["Deployment frontend, nginx,<br/>NodePort Service on port frontend.nodePort"]
    subgraph backendpod["Deployment backend, one pod, replaced by Recreate"]
      migrate["Init container migrate,<br/>the backend's image"]
      backend["Container backend,<br/>ClusterIP Service"]
    end
    postgres[("StatefulSet postgres,<br/>ClusterIP Service,<br/>1 GiB volume from a claim template")]
    cron["CronJob price-fill,<br/>daily at 01:00 Europe/Berlin"]
  end
  page -- "node address and NodePort" --> frontend
  extension -- "/rpc at the node address and NodePort" --> frontend
  frontend -- "/rpc and /logos, adds API_TOKEN" --> backend
  migrate -- "pgschema brings the database to schema.sql,<br/>before the backend starts" --> postgres
  backend --> postgres
  cron -- "price.fill with API_TOKEN" --> backend
  secret -.-> frontend & backendpod & postgres & cron
```

The chart [`chart/`](../../chart/) deploys one release per namespace under fixed resource names, with `frontend.nodePort` as the one value a deployment sets, which Kubernetes picks when unset.
It reads the Secret `finance-tracker`, which the deployment provides; the backend's database URL holds `POSTGRES_PASSWORD` unescaped, so it must be URL-safe.
A NetworkPolicy admits connections to PostgreSQL only from the backend's pod, so the frontend's NodePort is the one way into the release from outside the cluster.

## Releases

```mermaid
flowchart LR
  merge["Merge to main"]
  subgraph actions["GitHub Actions"]
    ci["CI"]
    tag["Tag v‹version›"]
    images["Build the images"]
    chart["Package the chart"]
    extension["Build and sign the extension"]
    release["GitHub release:<br/>XPI and updates.json"]
  end
  ghcr[("ghcr.io")]
  amo["addons.mozilla.org,<br/>unlisted"]
  firefox["Installed extension in Firefox"]
  cluster["The home network's cluster"]
  merge --> ci --> tag
  tag --> images -- "finance-tracker-backend,<br/>finance-tracker-frontend" --> ghcr
  images --> chart -- "charts/finance-tracker" --> ghcr
  tag --> extension -- "build and its sources" --> amo -- "signed XPI" --> extension
  chart & extension --> release
  firefox -- "updates.json of the latest release, daily" --> release
  cluster -- "chart and images of a version" --> ghcr
```

Every merge to `main` releases all artifacts under one version, which [`release.yml`](../../.github/workflows/release.yml) derives from the last `v*` tag and the merge's Conventional Commit subject.
