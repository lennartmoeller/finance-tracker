import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  imports: false,
  // WXT's default, the first open port from 3000, misses the backend's port 3000 when it is forwarded on IPv4 only, and takes it on IPv6.
  dev: { server: { port: 3001 } },
  manifestVersion: 3,
  manifest: {
    name: "Finance Tracker",
    permissions: [
      "downloads",
      "scripting",
      "storage",
      "webNavigation",
      "webRequest",
      "webRequestBlocking",
      "webRequestFilterResponse",
    ],
    host_permissions: [
      "http://localhost/*",
      "https://app.traderepublic.com/*",
      "https://meine.deutsche-bank.de/*",
      "https://api.olb.deutsche-bank.de/*",
      "https://portal.fnz.de/*",
    ],
    browser_specific_settings: {
      gecko: {
        // addons.mozilla.org signs releases for this ID and Firefox keeps the stored API token under it, so it keeps its name without the service prefix.
        id: "finance-tracker@lennartmoeller",
        strict_min_version: "140.0",
        data_collection_permissions: { required: ["financialAndPaymentInfo"] },
      },
    },
  },
});
