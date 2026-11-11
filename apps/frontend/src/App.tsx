import { useEffect, useState } from "react";
import { ArrowRightLeft, LayoutDashboard } from "lucide-react";
import { bank } from "@finance-tracker/shared/bank";
import { errorMessage } from "@finance-tracker/shared/client";
import type {
  Account,
  Price,
  Transaction,
} from "@finance-tracker/shared/contract";
import { Overview } from "./Overview.tsx";
import { Transactions, type Scope } from "./Transactions.tsx";

export type Data = {
  accounts: Account[];
  transactions: Transaction[];
  prices: Price[];
};

const views = [
  { id: "overview", name: "Overview", Icon: LayoutDashboard },
  { id: "transactions", name: "Transactions", Icon: ArrowRightLeft },
] as const;

const byBankAndName = (a: Account, b: Account) =>
  bank.options.indexOf(a.bank) - bank.options.indexOf(b.bank) ||
  a.name.localeCompare(b.name);

export function App({ load }: { load: () => Promise<Data> }) {
  const [data, setData] = useState<Data>();
  const [error, setError] = useState("");
  const [view, setView] = useState<(typeof views)[number]["id"]>("overview");
  const [scope, setScope] = useState<Scope>({ type: "cash", accountId: null });

  useEffect(() => {
    let current = true;
    setData(undefined);
    setError("");
    load().then(
      (loaded) => {
        if (current)
          setData({
            ...loaded,
            accounts: loaded.accounts.toSorted(byBankAndName),
          });
      },
      (failure: unknown) => {
        if (current) setError(errorMessage(failure));
      },
    );
    return () => {
      current = false;
    };
  }, [load]);

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
            data={data}
            error={error}
            onOpen={(next) => {
              setScope(next);
              setView("transactions");
            }}
          />
        ) : (
          <Transactions
            key={`${scope.type}-${String(scope.accountId)}`}
            data={data}
            error={error}
            scope={scope}
            onScope={setScope}
          />
        )}
      </main>
    </div>
  );
}
