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
    host_permissions: [
      "http://localhost/*",
      ...adapters.flatMap(({ hosts }) => hosts),
    ],
    browser_specific_settings: {
      gecko: {
        // addons.mozilla.org signs releases for this ID and Firefox keeps the stored API token under it, so it never changes.
        id: "finance-tracker@lennartmoeller",
        strict_min_version: "140.0",
        data_collection_permissions: { required: ["financialAndPaymentInfo"] },
      },
    },
  },
});
