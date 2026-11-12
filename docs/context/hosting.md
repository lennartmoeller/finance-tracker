# Hosting

## A Helm chart on K3s is the only production deployment

**Id:** 4fade0dd-8483-47e6-9e4d-862672214e6a
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** conversation with the maintainer, 2026-11-12

The repository publishes a Helm chart and the images it uses, and the home network's K3s cluster deploys the finance tracker from them.
Docker Compose stays the local way to run and test the system.

**Reason:** the maintainer likes Helm charts and deploys every other application in the cluster as one, so one packaging serves them all, and the home network already installs third-party software as wrapper charts.

**Rejected alternative:** unknown.

## The chart has fixed names, one value and one Secret

**Id:** b502b030-c0d4-4e30-a029-2373ba15ae07
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** the coding agent's proposal, agreed in the home network's planning and confirmed by the maintainer with the plan on 2026-11-12
**See:** hosting.md#a-helm-chart-on-k3s-is-the-only-production-deployment — 4fade0dd-8483-47e6-9e4d-862672214e6a — as of 2026-11-12

The chart names its resources `backend`, `frontend`, `postgres` and `price-fill`, without the release name and without template helpers, so one release lives per namespace.
It reads the existing Secret `finance-tracker` with `API_TOKEN`, `LOGO_DEV_SECRET_KEY` and `POSTGRES_PASSWORD` and never creates it, and its one value for a deployment is `frontend.nodePort`.
It has no probes, resource limits, Ingress, Helm hooks, CRDs, `lookup` or random values.

**Reason:** the nginx template's `http://backend:3000` then works in Compose and in the chart alike.

**Reason:** the home network is the chart's one consumer and sets only the port; Argo CD renders with `helm template`, so a looked-up or random value would change on every render; the backend's migrate step retries until PostgreSQL answers, so probes would add nothing.

**Rejected alternative:** resource names prefixed with the release name through template helpers, Helm's convention, which needs the backend's name passed into the nginx configuration.

**Consequence:** `POSTGRES_PASSWORD` goes unescaped into the backend's database URL, so it must be URL-safe.

**Consequence:** the PostgreSQL image is pinned in `compose.yaml` and in `chart/values.yaml`, each bumped by its own Dependabot ecosystem.

## The chart brings its own PostgreSQL

**Id:** 8d06b288-8164-4561-a4e8-a7bf80152a0d
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** conversation with the maintainer, 2026-11-12

The chart runs PostgreSQL as a StatefulSet from the image Compose uses, with its volume from a claim template on K3s's local path provisioner and the superuser's password from the chart's Secret, so the migrate step may create the database `pgschema_plan`.

**Reason:** the chart installs a complete finance tracker on its own, as Compose does locally, and one instance per application needs no decision about later applications.

**Rejected alternative:** a database URL from outside, which keeps the chart smallest but leaves the finance tracker uninstallable until the home network decides its PostgreSQL arrangement, and needs the right to create a database granted by hand.

**Rejected alternative:** a CloudNativePG cluster, whose failover, object-storage backups and major upgrades a single node mostly leaves unused, at the cost of an operator, its CRDs and managed roles.

**Consequence:** a PostgreSQL major upgrade stays a dump and restore by hand, as in Compose, and backups come from the home network.

## The migrate step is the backend pod's init container

**Id:** 48a4f722-cea0-4232-a662-ac0692bb6fce
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** the coding agent's proposal, agreed in the home network's planning and confirmed by the maintainer with the plan on 2026-11-12
**See:** database.md#pgschema-brings-the-database-to-schemasql-before-the-backend-starts — 394c5719-fa83-4862-a00a-a71b972bebc3 — as of 2026-11-12

The backend runs as one pod replaced by the `Recreate` strategy, and its init container runs the migrate step from the same image, so the step runs once before the backend starts and never beside an older pod's.
A refused plan keeps the pod in its init container and the backend down, until the change by hand has run and the init container's next retry applies the rest.

**Reason:** Argo CD turns Helm's pre-install and pre-upgrade hooks into a sync phase that runs before PostgreSQL's StatefulSet exists on the first sync.

**Reason:** `Recreate` is the only strategy that guarantees no two migrate steps overlap, which pgschema needs because it takes no lock; and with every release merged into the cluster automatically, a stopped backend is the visible signal.

**Rejected alternative:** a migrate Job as a Helm hook, for the sync order above.

**Rejected alternative:** the default `RollingUpdate`, which keeps the old backend serving through a refusal but can overlap a terminating pod's migrate step with a newer one's.

**Rejected alternative:** a CI job that plans the schema against the last release's, which stays red for every change that needs a hand step and so cannot gate.

**Consequence:** the backend is down from a refused plan until the change by hand runs in the cluster.

## Only the frontend is reachable from outside the cluster

**Id:** f866a1c6-6b1a-4757-a8c9-1cbca2957be3
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** a proposal from the home network's planning, decided by the maintainer on 2026-11-12

The frontend's Service is a NodePort, and the backend's and PostgreSQL's are cluster-internal.
The browser extension's address in the cluster is the frontend's origin, whose nginx forwards `/rpc` to the backend with its own token, and the daily price fill calls the backend inside the cluster.

**Reason:** the frontend's port grants full access without a token anyway, so a backend NodePort with its token check adds an exposed port and a value but no protection.

**Rejected alternative:** a NodePort for the backend as well, which the extension would reach with its own token.

**Consequence:** in the cluster the extension's token goes unused; locally it still guards the backend's port 3000.

## A NetworkPolicy admits only the backend to PostgreSQL

**Id:** 8dbdac08-a144-4b93-a4c8-a0b1e059df2e
**Type:** decision
**Type:** constraint
**Status:** active
**Evidence:** confirmed
**Source:** conversation with the maintainer, 2026-11-12, narrowed from the namespace's pods to the backend's on a proposal from the home network's planning of the same day

The chart always ships a NetworkPolicy that admits connections to PostgreSQL's pod only from the backend's pod, whose init container runs the migrate step, and has no value to switch it off.

**Reason:** the node forwards LAN traffic to pod addresses, so a LAN host that routes the pod network through the node reaches PostgreSQL's port directly, and K3s enforces NetworkPolicies; the chart owns PostgreSQL, so its isolation lives with it.

**Rejected alternative:** the password alone, leaving any policy to the home network's wrapper chart.

## nginx serves the frontend and adds the API token

**Id:** 5de12c1a-cef7-49ba-8e78-8dc488c7f6b3
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** conversation with the maintainer, 2026-11-12
**Revisit when:** the frontend's port becomes reachable from beyond the LAN and the home network's VPN

The frontend's image serves its production build on the official nginx image, which proxies `/rpc` and `/logos` to the backend and adds `Authorization: Bearer` with `API_TOKEN` from its environment, through the image's template substitution.
The frontend's code knows no token, and its dev server adds the token the same way during development.

**Reason:** the page loads logos as `<img>`, which cannot carry a bearer header, so a server must add the token, and nginx is the standard static server and reverse proxy.

**Rejected alternative:** the backend serving the frontend on a second, token-free port, which saves the image and nginx but adds hand-written static file serving and a second authorization mode to the backend.

**Rejected alternative:** a login in the frontend with a cookie, which protects the data on the LAN but needs a login screen, cookie handling in the backend and a changed dev proxy.

**Consequence:** whoever reaches the frontend's port on the LAN or through the VPN reads and changes all data without a login, as anyone on `localhost` can with Compose.

**Consequence:** a second image, and nginx's configuration as one more language.

## The frontend's image follows nginx's mainline series

**Id:** 54ea2989-5dba-49f4-9b35-f51482d5db20
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** conversation with the maintainer, 2026-11-12
**See:** hosting.md#nginx-serves-the-frontend-and-adds-the-api-token — 5de12c1a-cef7-49ba-8e78-8dc488c7f6b3 — as of 2026-11-12

The frontend's image starts from nginx's mainline series, and Dependabot bumps it like every other base image.

**Reason:** nginx recommends mainline for most users, and Dependabot proposes the highest version, which is always mainline, without further configuration.

**Rejected alternative:** the stable series, which needs a Dependabot ignore rule for the mainline minor, raised by hand each year when a new stable series appears.

## Compose runs the production frontend too

**Id:** 5fbdcb95-902a-4127-b0ce-d9309308937e
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** conversation with the maintainer, 2026-11-12
**See:** hosting.md#nginx-serves-the-frontend-and-adds-the-api-token — 5de12c1a-cef7-49ba-8e78-8dc488c7f6b3 — as of 2026-11-12

Compose builds and runs the frontend's nginx image beside the backend, so running the system for use is one Compose command, and the frontend's dev server serves development and the mock mode only.

**Reason:** Compose is the local test path, so it runs the same frontend image and configuration as the cluster.

**Rejected alternative:** the frontend's dev server for use as well, which leaves the production build and the nginx configuration untested until the cluster.

## The cluster starts with an empty database

**Id:** 5b7412c9-d0d0-4e06-8be8-8287ff03c2f7
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** conversation with the maintainer, 2026-11-12

The cluster's PostgreSQL starts empty: the extension syncs every account again and `price.fill` refills the prices, and no procedure moves data from a Compose database.

**Reason:** the home network treats the finance tracker as early and resettable.

**Rejected alternative:** moving the Compose database once by `pg_dump` into the cluster, with the command in the home network's stage plan or as a procedure in `CONTRIBUTING.md`.

**Consequence:** history that the banks no longer export exists only in the Compose database on the maintainer's machine, as long as its volume exists.

## Every merge to `main` releases everything under one version

**Id:** 66a5b052-777d-4820-a44a-5ce88ba18203
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** conversation with the maintainer, 2026-11-12

Each push to `main` derives the next semantic version from the last `v*` tag and the pushed commit's Conventional Commit subject, tags the commit, and publishes the images, the chart and the signed extension under that version.
The version lives only in the tag: `chart/Chart.yaml` and the extension's `package.json` hold `0.0.0`, which the release overwrites in its build, and no release commit goes to `main`.
The first release is 1.0.0, from a pull request titled as a breaking change.

**Reason:** no manual step, the maintainer's established release pattern, and squash merges with Conventional Commit titles already give one typed commit per merge.

**Reason:** a tag-only version needs no bot push to `main` and no `[skip ci]`.

**Reason:** a plain `feat` from 0.0.0 computes 0.1.0, which addons.mozilla.org rejects because the extension's 0.1.0 is already signed, and Firefox updates only upward.

**Rejected alternative:** a release started by hand, a manual step and a hand-picked version each time.

**Rejected alternative:** release-please, a further tool with two configuration files, a changelog and bot pull requests.

**Rejected alternative:** committing each version back to `main`.

**Rejected alternative:** a first release 0.2.0 from a hand-made seed tag `v0.1.0`.

**Consequence:** docs and chore merges make patch releases too, and every release signs an extension version on addons.mozilla.org.

**Consequence:** the home network merges every new chart version once its CI, which only renders the chart, passes, so this repository's CI is the only gate before a release reaches the cluster.

## The release runs CI first

**Id:** 177c7b22-84f6-468c-ba73-92b877b89581
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** the coding agent's proposal, confirmed by the maintainer with the plan on 2026-11-12
**See:** hosting.md#every-merge-to-main-releases-everything-under-one-version — 66a5b052-777d-4820-a44a-5ce88ba18203 — as of 2026-11-12

The release workflow calls the CI workflow on the pushed commit before it computes a version, and CI no longer runs on pushes to `main` by itself, so `main` runs CI once.

**Reason:** `main` has no branch protection and every release reaches the cluster by itself, so a merge with a red check must not publish.

**Rejected alternative:** branch protection that requires CI, a setting outside the repository's files.

**Rejected alternative:** publishing in parallel with CI.

**Consequence:** a release waits for CI, CodeQL included.

## Pull requests build the images and lint the chart

**Id:** 1488636a-b6b9-4e1b-87ff-f9b89b5dd1b9
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** conversation with the maintainer, 2026-11-12

CI builds both images without pushing them and runs `helm lint --strict` on the chart with the Helm version in `.tool-versions`, which the release uses too; `pnpm check` stays the local quality gate for the code.

**Reason:** every merge releases, so a broken Dockerfile, production build or template must fail before the merge, and the release needs Helm anyway.

**Rejected alternative:** `helm template` piped into `kubeconform -strict`, a second hand-pinned tool that repeats the home network's check on every chart version.

**Rejected alternative:** no checks before the merge, which tags broken releases.

**Consequence:** Dependabot cannot bump Helm's version, so `.tool-versions` is updated by hand, like `.nvmrc`.

## The chart is an OCI artifact on ghcr.io

**Id:** 33fa8b04-bf77-477e-b507-ec89896257bd
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** conversation with the maintainer, 2026-11-12

The release pushes the chart to `oci://ghcr.io/lennartmoeller/charts`, next to the images.

**Reason:** one registry and one login for every artifact, no further branch or action, and Argo CD builds a public OCI dependency without credentials.

**Rejected alternative:** a Helm repository on GitHub Pages through chart-releaser, which adds a `gh-pages` branch, an action and an index that grows with every release.

**Consequence:** the packages that the release pushes from this public repository come out public, so the cluster pulls them without credentials; GitHub's documentation contradicts itself on whether a pushed package inherits the repository's visibility, and the first release on 2026-11-12 showed that it does.

## The user enters the backend's address in the popup

**Id:** 89fc97da-5d46-4302-b7b8-5bfbc454bef9
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** conversation with the maintainer, 2026-11-12
**Revisit when:** the finance tracker is served over HTTPS

The popup's form "Connect to the backend" asks for the backend's address beside the API token, opens whenever loading fails as unreachable or unauthorized and from a settings button in the header, and requests the host permission for the address's origin when saved, through optional host permissions.
The extension's pages drop Firefox's default `upgrade-insecure-requests` with an explicit content security policy, so a plain-HTTP LAN address stays HTTP in a release build.

**Reason:** one signed build serves Compose and the cluster, the public repository holds no LAN address, and a changed address needs no release; an update could not grant a new host permission by itself anyway.

**Reason:** the settings button changes the address while the old one still answers.

**Rejected alternative:** the cluster's address built in by the release, which leaves the signed build unable to reach a local Compose backend and needs a release plus a permission toggle in `about:addons` for every change of address.

**Rejected alternative:** the form on failure alone, which saves the button but changes the address only once the old one fails.

**Consequence:** Mozilla's add-on policies ask for encryption "when transporting data remotely", and the plain-HTTP LAN address is the maintainer's choice, not the add-on's.

## Firefox updates the unlisted extension from the GitHub releases

**Id:** 229cf894-ae28-4bab-9a5c-f1a090ec25ec
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** conversation with the maintainer, 2026-11-12
**See:** hosting.md#every-merge-to-main-releases-everything-under-one-version — 66a5b052-777d-4820-a44a-5ce88ba18203 — as of 2026-11-12

addons.mozilla.org signs the extension on the unlisted channel, and every GitHub release carries the signed XPI and an `updates.json` that lists it, which the manifest's `update_url` names through the latest release, so Firefox installs each new version within a day by itself.
The XPI is public, as the repository is, and the first installation is "Install Add-on From File" with a release's XPI.

**Reason:** every merge releases, so only automatic updates keep the extension in step with the backend, whose API makes no compatibility promises.

**Rejected alternative:** installing each release's XPI by hand, which leaves the extension behind the backend.

**Rejected alternative:** keeping the XPI out of the public release as a workflow artifact, which rules out automatic updates.

**Consequence:** that Firefox follows GitHub's two HTTPS redirects from `update_url` to the asset is read from Firefox's source, not documented by Mozilla.
