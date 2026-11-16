import { useMemo, useSyncExternalStore } from "react";
import { accountType, type Account } from "@finance-tracker/shared/contract";

export type Sort = { column: string; descending: boolean };

const transferFilters = ["only", "probable", "none"] as const;

export type TransferFilter = (typeof transferFilters)[number];

export type Route =
  | { view: "overview" }
  | {
      view: "transactions";
      tab: Account["type"];
      filters: Record<string, string>;
      sort: Sort | null;
      transfers: TransferFilter | null;
    }
  | { view: "accounts"; accountId: number | null }
  | { view: "securities"; isin: string | null }
  | { view: "rules"; tab: "brands" | "categories" };

export function parseRoute({ pathname, searchParams }: URL): Route {
  const [, view, item = ""] = pathname.split("/");
  switch (view) {
    case "transactions": {
      const { sort, transfers, ...filters } = Object.fromEntries(
        [...searchParams].filter(([, value]) => value),
      );
      return {
        view,
        tab: accountType.catch("cash").parse(item),
        filters,
        sort: sort
          ? { column: sort.replace(/^-/, ""), descending: sort.startsWith("-") }
          : null,
        transfers:
          transferFilters.find((filter) => filter === transfers) ?? null,
      };
    }
    case "accounts":
      return { view, accountId: /^\d+$/.test(item) ? Number(item) : null };
    case "securities":
      return { view, isin: item || null };
    case "rules":
      return { view, tab: item === "categories" ? item : "brands" };
    default:
      return { view: "overview" };
  }
}

export function href(route: Route): string {
  switch (route.view) {
    case "overview":
      return "/";
    case "transactions": {
      const query = new URLSearchParams(
        Object.entries(route.filters).filter(([, text]) => text),
      );
      if (route.sort)
        query.set(
          "sort",
          `${route.sort.descending ? "-" : ""}${route.sort.column}`,
        );
      if (route.transfers) query.set("transfers", route.transfers);
      return `/transactions/${route.tab}${query.size ? `?${query.toString()}` : ""}`;
    }
    case "accounts":
      return `/accounts${route.accountId === null ? "" : `/${String(route.accountId)}`}`;
    case "securities":
      return `/securities${route.isin === null ? "" : `/${route.isin}`}`;
    case "rules":
      return `/rules/${route.tab}`;
  }
}

const subscribe = (onChange: () => void) => {
  navigation.addEventListener("currententrychange", onChange);
  return () => {
    navigation.removeEventListener("currententrychange", onChange);
  };
};

export function useRoute() {
  const address = useSyncExternalStore(subscribe, () => location.href);
  return useMemo(() => parseRoute(new URL(address)), [address]);
}
