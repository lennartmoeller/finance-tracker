import { createApiClient } from "@finance-tracker/shared/client";

export type Connection = { address: string; apiToken: string };

export async function storedConnection(): Promise<Connection> {
  const { address, apiToken } = await browser.storage.local.get([
    "address",
    "apiToken",
  ]);
  return {
    address: typeof address === "string" ? address : "http://localhost:3000",
    apiToken: typeof apiToken === "string" ? apiToken : "",
  };
}

export async function apiClient() {
  const { address, apiToken } = await storedConnection();
  return createApiClient(`${address}/rpc`, apiToken);
}

export async function saveConnection(connection: Connection) {
  await browser.storage.local.set(connection);
}
