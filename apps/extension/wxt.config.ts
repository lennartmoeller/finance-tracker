import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  imports: false,
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
    host_permissions: ["http://localhost/*", "https://app.traderepublic.com/*"],
    browser_specific_settings: {
      gecko: {
        id: "finance-tracker@lennartmoeller",
        strict_min_version: "140.0",
        data_collection_permissions: { required: ["financialAndPaymentInfo"] },
      },
    },
  },
});
