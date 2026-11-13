import { useEffect, useState } from "react";
import {
  ArrowRightLeft,
  ChartLine,
  LayoutDashboard,
  ListFilter,
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
import { Overview } from "./overview/Overview.tsx";
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

export type Api = Pick<ApiClient, "brand" | "category">;

export type Change = (call: (api: Api) => Promise<unknown>) => Promise<void>;

export type Loading = { data: Data | undefined; error: string };

export type Scope = { type: Account["type"]; accountId: number | null };

const views = [
  { id: "overview", name: "Overview", Icon: LayoutDashboard },
  { id: "securities", name: "Securities", Icon: ChartLine },
  { id: "transactions", name: "Transactions", Icon: ArrowRightLeft },
  { id: "rules", name: "Rules", Icon: ListFilter },
] as const;

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
  const [view, setView] = useState<(typeof views)[number]["id"]>("overview");
  const [scope, setScope] = useState<Scope>({ type: "cash", accountId: null });

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
    await call(api);
    setLoading(sorted(await load()));
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="app-title">Finance Tracker</div>
        <nav className="nav">
          {views.map(({ id, name, Icon }) => (
            <button
              key={id}
              aria-current={view === id ? "page" : undefined}
              onClick={() => {
                setView(id);
              }}
            >
              <Icon />
              {name}
            </button>
          ))}
        </nav>
      </aside>
      <main className="main">
        {view === "overview" ? (
          <Overview
            loading={loading}
            onOpen={(next) => {
              setScope(next);
              setView("transactions");
            }}
          />
        ) : view === "securities" ? (
          <Securities loading={loading} />
        ) : view === "rules" ? (
          <Rules loading={loading} onChange={change} />
        ) : (
          <Transactions
            key={`${scope.type}-${String(scope.accountId)}`}
            loading={loading}
            scope={scope}
            onScope={setScope}
          />
        )}
      </main>
    </div>
  );
}
