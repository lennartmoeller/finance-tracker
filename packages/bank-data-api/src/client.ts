import { createORPCClient, ORPCError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import type { contract } from "./contract.ts";

export function createApiClient(
  url: string,
  token: string,
): ContractRouterClient<typeof contract> {
  return createORPCClient(
    new RPCLink({ url, headers: { authorization: `Bearer ${token}` } }),
  );
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ORPCError && error.code === "UNAUTHORIZED";
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
