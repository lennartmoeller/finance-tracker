import { useMemo, useState } from "react";
import { ChevronRight, Landmark, Pencil, Plus } from "lucide-react";
import type { Account } from "@finance-tracker/shared/contract";
import { syncedBy } from "@finance-tracker/shared/bank";
import { decimalSum } from "@finance-tracker/shared/decimal";
import { freshness, lastSyncText } from "@finance-tracker/shared/last-sync";
import { AccountName } from "../AccountName.tsx";
import { accountText } from "../account-text.ts";
import type { Change, Data, Loading } from "../App.tsx";
import { banks } from "../banks.ts";
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
import { exactly } from "../pattern.ts";
import { href } from "../route.ts";
import { TransactionsLink } from "../TransactionsLink.tsx";
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
  onEdit: (id: number) => void;
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
  accountId,
  onChange,
}: {
  loading: Loading;
  accountId: number | null;
  onChange: Change;
}) {
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
              selectedId={accountId}
              onEdit={(id) => {
                setEditing({ id });
              }}
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

function AccountActions({
  account,
  labelled,
  onEdit,
}: {
  account: Account;
  labelled: boolean;
  onEdit: (id: number) => void;
}) {
  const className = labelled ? undefined : "icon-button";
  return (
    <>
      <TransactionsLink
        tab={account.type}
        filters={{ account: exactly(accountText(account)) }}
        className={className}
        labelled={labelled}
      />
      <button
        className={className}
        title={labelled ? undefined : "Edit"}
        onClick={() => {
          onEdit(account.id);
        }}
      >
        <Pencil />
        {labelled && "Edit"}
      </button>
    </>
  );
}

function AccountList({ data, selectedId, onEdit }: ListProps) {
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
          <a
            href={href({ view: "accounts", accountId: null })}
            aria-current={selected ? undefined : "page"}
          >
            All accounts
          </a>
          {selected && (
            <>
              <ChevronRight />
              <span aria-current="page">
                <AccountName account={selected} />
              </span>
              <span className="crumb-actions">
                <AccountActions account={selected} labelled onEdit={onEdit} />
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
                >
                  <td>
                    <a
                      className="stretched"
                      href={href({
                        view: "accounts",
                        accountId: account === selected ? null : account.id,
                      })}
                    >
                      <AccountName account={account}>
                        {account.closed && (
                          <span className="closed-tag">Closed</span>
                        )}
                        {syncedBy(banks, account) && (
                          <span
                            className={`dot ${freshness(account.lastSyncedAt)}`}
                            title={lastSyncText(account.lastSyncedAt)}
                          />
                        )}
                      </AccountName>
                    </a>
                  </td>
                  <td className="num">{value && formatMoney(value)}</td>
                  <td>
                    <div className="row-actions">
                      <AccountActions
                        account={account}
                        labelled={false}
                        onEdit={onEdit}
                      />
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
