import { createORPCClient, ORPCError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import type { contract } from "./contract.ts";

export const createApiClient = (
  url: string,
  token?: string,
): ContractRouterClient<typeof contract> =>
  createORPCClient(
    new RPCLink({
      url,
      headers: token === undefined ? {} : { authorization: `Bearer ${token}` },
      fetch: (request, init) =>
        fetch(request, init).catch(() => {
          throw new Error("Can't reach the backend.");
        }),
    }),
  );

export const isUnauthorized = (error: unknown) =>
  error instanceof ORPCError && error.code === "UNAUTHORIZED";
