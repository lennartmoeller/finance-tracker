import { discover } from "@finance-tracker/shared/discover";
import type { BankAdapter } from "@finance-tracker/shared/bank";
import { defineConfig } from "wxt";

const adapters = await discover<BankAdapter>("adapter.ts");

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  imports: false,
  // WXT turns the adapters' global browser into an import of wxt/browser, which only resolves from this package.
  vite: () => ({ resolve: { dedupe: ["wxt"] } }),
  // WXT's default, the first open port from 3000, misses the backend's port 3000 when it is forwarded on IPv4 only, and takes it on IPv6.
  dev: { server: { port: 3001 } },
  // addons.mozilla.org needs the sources the build reads, which include the shared package and the workspace's lockfile, whose install needs every package's manifest.
  zip: {
    sourcesRoot: `${import.meta.dirname}/../..`,
    includeSources: [
      "package.json",
      "pnpm-lock.yaml",
      "pnpm-workspace.yaml",
      "tsconfig.base.json",
      "src/*/package.json",
      "src/shared/**",
      "src/browser-extension/**",
    ],
  },
  manifestVersion: 3,
  manifest: {
    name: "Finance Tracker",
    permissions: [
      ...new Set([
        "scripting",
        "storage",
        "webNavigation",
        ...adapters.flatMap(({ permissions }) => permissions),
      ]),
    ],
    host_permissions: adapters.flatMap(({ hosts }) => hosts),
    // The popup asks for the backend's origin when the user enters its address.
    optional_host_permissions: ["http://*/*", "https://*/*"],
    // Firefox's default adds upgrade-insecure-requests, which turns a plain-HTTP backend on the LAN into an HTTPS request that fails.
    content_security_policy: { extension_pages: "script-src 'self'" },
    browser_specific_settings: {
      gecko: {
        // addons.mozilla.org signs releases for this ID and Firefox keeps the stored API token under it, so it never changes.
        id: "finance-tracker@lennartmoeller",
        strict_min_version: "140.0",
        update_url:
          "https://github.com/lennartmoeller/finance-tracker/releases/latest/download/updates.json",
        data_collection_permissions: { required: ["financialAndPaymentInfo"] },
      },
    },
  },
});
