import { createApiClient } from "@finance-tracker/api/client";

export async function apiClient() {
  const { apiToken } = await browser.storage.local.get("apiToken");
  return createApiClient(
    "http://localhost:3000/rpc",
    typeof apiToken === "string" ? apiToken : "",
  );
}

export async function saveApiToken(apiToken: string) {
  await browser.storage.local.set({ apiToken });
}
