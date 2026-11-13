import { createORPCClient, ORPCError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import type { contract } from "./contract.ts";

class Unreachable extends Error {}

export type ApiClient = ContractRouterClient<typeof contract>;

export const createApiClient = (url: string, token?: string): ApiClient =>
  createORPCClient(
    new RPCLink({
      url,
      headers: token === undefined ? {} : { authorization: `Bearer ${token}` },
      fetch: (request, init) =>
        fetch(request, init).catch(() => {
          throw new Unreachable("Can't reach the backend.");
        }),
    }),
  );

export const isUnauthorized = (error: unknown) =>
  error instanceof ORPCError && error.code === "UNAUTHORIZED";

export const isUnreachable = (error: unknown) => error instanceof Unreachable;
