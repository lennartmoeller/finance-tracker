import { useEffect, useState } from "react";
import {
  ArrowRightLeft,
  ChartLine,
  Landmark,
  LayoutDashboard,
  ListFilter,
  type LucideIcon,
} from "lucide-react";
import type { ApiClient } from "@finance-tracker/shared/client";
import { errorMessage } from "@finance-tracker/shared/error-message";
import type {
  Account,
  Brand,
  Category,
  Price,
  Transaction,
} from "@finance-tracker/shared/contract";
import { Accounts } from "./accounts/Accounts.tsx";
import { Overview } from "./overview/Overview.tsx";
import { href, useRoute, type Route } from "./route.ts";
import { Rules } from "./rules/Rules.tsx";
import { Securities } from "./securities/Securities.tsx";
import { Transactions } from "./transactions/Transactions.tsx";

export type Data = {
  accounts: Account[];
  transactions: Transaction[];
  prices: Price[];
  brands: Brand[];
  categories: Category[];
};

export type Api = Pick<
  ApiClient,
  "account" | "brand" | "category" | "sync" | "transfer"
>;

export type Change = <T>(call: (api: Api) => Promise<T>) => Promise<T>;

export type Loading = { data: Data | undefined; error: string };

const views: { route: Route; name: string; Icon: LucideIcon }[] = [
  { route: { view: "overview" }, name: "Overview", Icon: LayoutDashboard },
  {
    route: {
      view: "transactions",
      tab: "cash",
      filters: {},
      sort: null,
      transfers: null,
    },
    name: "Transactions",
    Icon: ArrowRightLeft,
  },
  {
    route: { view: "accounts", accountId: null },
    name: "Accounts",
    Icon: Landmark,
  },
  {
    route: { view: "securities", isin: null },
    name: "Securities",
    Icon: ChartLine,
  },
  { route: { view: "rules", tab: "brands" }, name: "Rules", Icon: ListFilter },
];

const byBankAndName = (a: Account, b: Account) =>
  a.bank.localeCompare(b.bank) || a.name.localeCompare(b.name);

const sorted = (data: Data) => ({
  data: { ...data, accounts: data.accounts.toSorted(byBankAndName) },
  error: "",
});

export function App({ load, api }: { load: () => Promise<Data>; api: Api }) {
  const [loading, setLoading] = useState<Loading>({
    data: undefined,
    error: "",
  });
  const route = useRoute();

  useEffect(() => {
    let current = true;
    setLoading({ data: undefined, error: "" });
    load().then(
      (data) => {
        if (current) setLoading(sorted(data));
      },
      (failure: unknown) => {
        if (current)
          setLoading({ data: undefined, error: errorMessage(failure) });
      },
    );
    return () => {
      current = false;
    };
  }, [load]);

  const change: Change = async (call) => {
    const result = await call(api);
    setLoading(sorted(await load()));
    return result;
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="app-title">Finance Tracker</div>
        <nav className="nav">
          {views.map(({ route: target, name, Icon }) => (
            <a
              key={name}
              href={href(target)}
              aria-current={route.view === target.view ? "page" : undefined}
            >
              <Icon />
              {name}
            </a>
          ))}
        </nav>
      </aside>
      <main className="main">
        {route.view === "overview" ? (
          <Overview />
        ) : route.view === "accounts" ? (
          <Accounts
            loading={loading}
            accountId={route.accountId}
            onChange={change}
          />
        ) : route.view === "securities" ? (
          <Securities loading={loading} isin={route.isin} />
        ) : route.view === "rules" ? (
          <Rules
            key={route.tab}
            loading={loading}
            tab={route.tab}
            onChange={change}
          />
        ) : (
          <Transactions
            key={route.tab}
            loading={loading}
            route={route}
            onChange={change}
          />
        )}
      </main>
    </div>
  );
}
