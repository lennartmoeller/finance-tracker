import { useMemo, useState } from "react";
import {
  ArrowRightLeft,
  ChevronRight,
  Landmark,
  Pencil,
  Plus,
} from "lucide-react";
import type { Account } from "@finance-tracker/shared/contract";
import { decimalSum } from "@finance-tracker/shared/decimal";
import { AccountName } from "../AccountName.tsx";
import type { Change, Data, Loading, Scope } from "../App.tsx";
import { DepotSummary } from "../DepotSummary.tsx";
import { Donut, type Slice } from "../Donut.tsx";
import {
  accountValue,
  dailyBalances,
  dailyTotals,
  dailyValues,
  priced,
  today,
  totalValue,
  unpricedAccounts,
  withFigures,
  withoutPrices,
  type AccountWithFigures,
} from "../figures.ts";
import { formatMoney } from "../format.ts";
import { Intro } from "../Intro.tsx";
import { Loaded, SkeletonRows } from "../Loaded.tsx";
import { none } from "../none.tsx";
import {
  balanceSeries,
  depotSeries,
  totalSeries,
  ValueChart,
} from "../ValueChart.tsx";
import { AccountPanel } from "./AccountPanel.tsx";
import "./accounts.css";

type Editing = { id?: number } | undefined;

type ListProps = {
  data: Data;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onEdit: (id: number) => void;
  onOpen: (scope: Scope) => void;
};

const worth = (account: AccountWithFigures) =>
  Number(accountValue(account) ?? 0);

const byPriority = (a: AccountWithFigures, b: AccountWithFigures) =>
  Number(a.closed) - Number(b.closed) ||
  b.transactions.length - a.transactions.length ||
  worth(b) - worth(a);

const heroAmount = (amount: string | null) => (
  <div className="hero-row">
    <span className="hero-amount">{amount ? formatMoney(amount) : none}</span>
  </div>
);

const slice = (
  key: string,
  value: string,
  fill: string,
  parts?: Slice[],
): Slice => ({
  keys: [key],
  value: Number(value),
  fill,
  ...(parts && { parts: parts.filter(({ value }) => value > 0) }),
});

// All four slices touch each other, and blue, amber, pink and dark green are the palette's only four that pass the validator for every pair in light and dark.
function moneySlices(accounts: AccountWithFigures[]) {
  const ofType = (type: Account["type"]) =>
    accounts.filter((account) => account.type === type);
  const pricedDepots = ofType("depot").flatMap(
    ({ figures }) => priced(figures) ?? [],
  );
  return [
    slice("Cash accounts", totalValue(ofType("cash")), "var(--category-1)"),
    slice("Depots", totalValue(ofType("depot")), "var(--category-4)", [
      slice(
        "Invested money",
        decimalSum(pricedDepots.map(({ invested }) => invested)),
        "var(--category-5)",
      ),
      slice(
        "Gain",
        decimalSum(pricedDepots.map(({ gain }) => gain)),
        "var(--category-6)",
      ),
    ]),
  ].filter(({ value }) => value > 0);
}

const depotTransactions = (accounts: AccountWithFigures[]) =>
  accounts.flatMap(({ transactions }) =>
    transactions.flatMap(({ depot }) => depot ?? []),
  );

function chartedValues(
  accounts: AccountWithFigures[],
  selected: AccountWithFigures | undefined,
  data: Data,
) {
  if (selected?.type === "cash") return dailyBalances([selected], today());
  if (selected)
    return dailyValues(depotTransactions([selected]), data.prices, today());
  return dailyTotals(
    dailyBalances(
      accounts.filter(({ type }) => type === "cash"),
      today(),
    ),
    dailyValues(
      depotTransactions(
        accounts.filter(
          ({ type, figures }) => type === "depot" && priced(figures),
        ),
      ),
      data.prices,
      today(),
    ),
  );
}

const skeleton = (
  <div className="scroll">
    <div className="figures">
      <span className="skeleton" />
      <span className="skeleton big" />
      <span className="skeleton chart-skeleton" />
    </div>
    <div className="donut-table">
      <div className="donut">
        <span className="skeleton" />
      </div>
      <div className="skeleton-rows">
        <SkeletonRows count={5} />
      </div>
    </div>
  </div>
);

export function Accounts({
  loading,
  onChange,
  onOpen,
}: {
  loading: Loading;
  onChange: Change;
  onOpen: (scope: Scope) => void;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Editing>();
  const edited = loading.data?.accounts.find(({ id }) => id === editing?.id);

  return (
    <>
      <header className="page-head plain">
        <h1>Accounts</h1>
        <button
          className="button secondary"
          disabled={!loading.data}
          onClick={() => {
            setEditing({});
          }}
        >
          <Plus />
          New account
        </button>
      </header>
      <div className="content">
        <Loaded loading={loading} skeleton={skeleton}>
          {(data) => (
            <AccountList
              data={data}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onEdit={(id) => {
                setEditing({ id });
              }}
              onOpen={onOpen}
            />
          )}
        </Loaded>
        {editing && loading.data && (
          <AccountPanel
            key={edited?.id ?? "new"}
            account={edited}
            accounts={loading.data.accounts}
            onChange={onChange}
            onClose={() => {
              setEditing(undefined);
            }}
          />
        )}
      </div>
    </>
  );
}

function AccountList({
  data,
  selectedId,
  onSelect,
  onEdit,
  onOpen,
}: ListProps) {
  const accounts = useMemo(
    () =>
      withFigures(data.accounts, data.transactions, data.prices).toSorted(
        byPriority,
      ),
    [data],
  );
  const selected = accounts.find(({ id }) => id === selectedId);
  const values = useMemo(
    () => chartedValues(accounts, selected, data),
    [accounts, selected, data],
  );
  const unpriced = unpricedAccounts(accounts);
  const slices = moneySlices(accounts);
  const actionsOf = (account: AccountWithFigures) => [
    {
      label: "Transactions",
      icon: <ArrowRightLeft />,
      run: () => {
        onOpen({ type: account.type, accountId: account.id });
      },
    },
    {
      label: "Edit",
      icon: <Pencil />,
      run: () => {
        onEdit(account.id);
      },
    },
  ];

  if (!accounts.length)
    return (
      <Intro
        icon={<Landmark />}
        title="No accounts yet"
        text="Add one with New account, then sync it in the browser extension's popup."
      />
    );

  return (
    <div className="scroll">
      <section className="figures">
        <nav className="crumbs" aria-label="Selection">
          <button
            aria-current={selected ? undefined : "page"}
            onClick={() => {
              onSelect(null);
            }}
          >
            All accounts
          </button>
          {selected && (
            <>
              <ChevronRight />
              <span aria-current="page">
                <AccountName account={selected} />
              </span>
              <span className="crumb-actions">
                {actionsOf(selected).map(({ label, icon, run }) => (
                  <button key={label} onClick={run}>
                    {icon}
                    {label}
                  </button>
                ))}
              </span>
            </>
          )}
        </nav>
        {!selected ? (
          <>
            {heroAmount(totalValue(accounts))}
            {unpriced.length > 0 && (
              <span className="note">{withoutPrices(unpriced)}</span>
            )}
          </>
        ) : selected.type === "cash" ? (
          heroAmount(selected.balance)
        ) : (
          <>
            <DepotSummary figures={selected.figures} shares={undefined} />
            {selected.figures && "unpriced" in selected.figures && (
              <span className="note">
                No price for {selected.figures.unpriced.join(", ")}.
              </span>
            )}
          </>
        )}
        <ValueChart
          values={values}
          series={
            !selected
              ? totalSeries
              : selected.type === "cash"
                ? balanceSeries
                : depotSeries
          }
        />
      </section>
      <div className="donut-table">
        {slices.length > 0 && (
          <aside className="donut" aria-label="All money by kind">
            <Donut
              slices={slices}
              tooltip={({ keys: [name], value }) => (
                <div className="readout">
                  <div className="readout-row">
                    <span className="key">{name}</span>
                    <strong>{formatMoney(String(value))}</strong>
                  </div>
                </div>
              )}
            />
          </aside>
        )}
        <table className="account-table">
          <thead>
            <tr>
              <th>Account</th>
              <th className="num">Value</th>
              <th className="actions" />
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => {
              const value = accountValue(account);
              return (
                <tr
                  key={account.id}
                  className={
                    [
                      account.closed && "closed",
                      account === selected && "selected",
                    ]
                      .filter(Boolean)
                      .join(" ") || undefined
                  }
                  onClick={() => {
                    onSelect(account === selected ? null : account.id);
                  }}
                >
                  <td>
                    <AccountName account={account}>
                      {account.closed && (
                        <span className="closed-tag">Closed</span>
                      )}
                    </AccountName>
                  </td>
                  <td className="num">{value ? formatMoney(value) : none}</td>
                  <td>
                    <div className="row-actions">
                      {actionsOf(account).map(({ label, icon, run }) => (
                        <button
                          key={label}
                          className="icon-button"
                          title={label}
                          onClick={(event) => {
                            event.stopPropagation();
                            run();
                          }}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
