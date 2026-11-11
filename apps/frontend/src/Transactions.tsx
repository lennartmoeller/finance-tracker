import { Fragment, useEffect, useState } from "react";
import { Inbox } from "lucide-react";
import {
  accountType,
  type Account,
  type CashTransaction,
  type DepotTransaction,
  type Transaction,
} from "@finance-tracker/shared/contract";
import { freshness, lastSyncText } from "@finance-tracker/shared/last-sync";
import { AccountName } from "./AccountName.tsx";
import type { Data } from "./App.tsx";
import {
  formatAmount,
  formatDate,
  formatMonth,
  formatQuantity,
} from "./format.ts";
import { Intro } from "./Intro.tsx";
import { Loaded } from "./Loaded.tsx";
import { Logo } from "./Logo.tsx";
import { none } from "./none.tsx";
import { TransactionPanel, type Details } from "./TransactionPanel.tsx";

export type Scope = { type: Account["type"]; accountId: number | null };

type CashRow = Transaction & { cash: CashTransaction };
type DepotRow = Transaction & { depot: DepotTransaction };

type Column<Row> = {
  name: string;
  width?: string;
  className?: string;
  cell: (row: Row) => React.ReactNode;
};

type Kind<Row extends Transaction> = {
  select: (transaction: Transaction) => transaction is Row;
  date: (row: Row) => string;
  columns: Column<Row>[];
  details: (row: Row) => Details;
};

const tabNames: Record<Account["type"], string> = {
  cash: "Cash",
  depot: "Depot",
};

const typeNames: Record<DepotTransaction["type"], string> = {
  trade: "Trade",
  reinvestment: "Reinvestment",
  fee: "Fee",
  tax: "Tax",
  distribution: "Distribution",
};

const oneLine = (text: string | null) => text?.replaceAll("\n", " ") ?? none;

const cashKind: Kind<CashRow> = {
  select: (transaction): transaction is CashRow => transaction.cash !== null,
  date: ({ cash }) => cash.date,
  columns: [
    {
      name: "Date",
      width: "116px",
      className: "muted",
      cell: ({ cash }) => formatDate(cash.date),
    },
    {
      name: "Brand",
      width: "170px",
      cell: ({ cash, brand }) => (
        <span className="named">
          <Logo
            src={brand?.logo ?? null}
            name={brand?.name ?? cash.counterparty}
          />
          <span>{brand?.name ?? none}</span>
        </span>
      ),
    },
    {
      name: "Counterparty",
      width: "24%",
      cell: ({ cash }) => cash.counterparty ?? none,
    },
    {
      name: "Description",
      className: "muted",
      cell: ({ cash }) => oneLine(cash.description),
    },
    {
      name: "Amount",
      width: "120px",
      className: "num",
      cell: ({ cash }) => formatAmount(cash.amount, cash.currency),
    },
  ],
  details: ({ cash, brand }) => ({
    logo: brand?.logo ?? null,
    title: brand?.name ?? cash.counterparty,
    amount: formatAmount(cash.amount, cash.currency),
    date: cash.date,
    fields: [
      ["Brand", brand?.name],
      ["Counterparty", cash.counterparty],
      ["Description", cash.description],
    ],
  }),
};

const depotAmount = ({ amount, currency }: DepotTransaction) =>
  amount && currency ? formatAmount(amount, currency) : null;

const depotKind: Kind<DepotRow> = {
  select: (transaction): transaction is DepotRow => transaction.depot !== null,
  date: ({ depot }) => depot.date,
  columns: [
    {
      name: "Date",
      width: "116px",
      className: "muted",
      cell: ({ depot }) => formatDate(depot.date),
    },
    {
      name: "Security",
      width: "30%",
      cell: ({ depot }) => (
        <span className="named">
          <Logo src={depot.securityLogo} name={depot.securityName} />
          <span>{depot.securityName}</span>
        </span>
      ),
    },
    {
      name: "Type",
      width: "120px",
      cell: ({ depot }) => (
        <span className="type">{typeNames[depot.type]}</span>
      ),
    },
    {
      name: "Description",
      className: "muted",
      cell: ({ depot }) => oneLine(depot.description),
    },
    {
      name: "Quantity",
      width: "100px",
      className: "num",
      cell: ({ depot }) =>
        depot.quantity ? formatQuantity(depot.quantity) : none,
    },
    {
      name: "Amount",
      width: "120px",
      className: "num",
      cell: ({ depot }) => depotAmount(depot) ?? none,
    },
  ],
  details: ({ depot }) => ({
    logo: depot.securityLogo,
    title: depot.securityName,
    amount: depotAmount(depot),
    date: depot.date,
    fields: [
      ["Security", depot.securityName],
      ["ISIN", <span className="isin">{depot.isin}</span>],
      ["Type", typeNames[depot.type]],
      ["Quantity", depot.quantity && formatQuantity(depot.quantity)],
      ["Description", depot.description],
    ],
  }),
};

export function Transactions({
  data,
  error,
  scope,
  onScope,
}: {
  data: Data | undefined;
  error: string;
  scope: Scope;
  onScope: (scope: Scope) => void;
}) {
  return (
    <>
      <header className="page-head">
        <h1>Transactions</h1>
        <div className="tabs" role="tablist">
          {accountType.options.map((type) => (
            <button
              key={type}
              role="tab"
              aria-selected={scope.type === type}
              onClick={() => {
                onScope({ type, accountId: null });
              }}
            >
              {tabNames[type]}
            </button>
          ))}
        </div>
      </header>
      <div className="content">
        <Loaded data={data} error={error} skeleton={<Skeleton />}>
          {(loaded) =>
            scope.type === "cash" ? (
              <TransactionList
                kind={cashKind}
                data={loaded}
                scope={scope}
                onScope={onScope}
              />
            ) : (
              <TransactionList
                kind={depotKind}
                data={loaded}
                scope={scope}
                onScope={onScope}
              />
            )
          }
        </Loaded>
      </div>
    </>
  );
}

function TransactionList<Row extends Transaction>({
  kind,
  data,
  scope,
  onScope,
}: {
  kind: Kind<Row>;
  data: Data;
  scope: Scope;
  onScope: (scope: Scope) => void;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  useEffect(() => {
    if (selectedId === null) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedId(null);
    };
    addEventListener("keydown", close);
    return () => {
      removeEventListener("keydown", close);
    };
  }, [selectedId]);

  const accounts = new Map(
    data.accounts.map((account) => [account.id, account]),
  );
  const rows = data.transactions
    .filter(kind.select)
    .filter(
      ({ accountId }) =>
        scope.accountId === null || accountId === scope.accountId,
    );
  const accountColumn: Column<Row> = {
    name: "Account",
    width: "150px",
    cell: ({ accountId }) => {
      const account = accounts.get(accountId);
      return account && <AccountName account={account} />;
    },
  };
  const columns =
    scope.accountId === null
      ? [...kind.columns.slice(0, -1), accountColumn, ...kind.columns.slice(-1)]
      : kind.columns;
  const selected = rows.find(({ id }) => id === selectedId);
  const selectedAccount = selected && accounts.get(selected.accountId);
  let month = "";

  return (
    <>
      <div className="chips" role="group" aria-label="Account">
        <button
          className="chip"
          aria-pressed={scope.accountId === null}
          onClick={() => {
            onScope({ ...scope, accountId: null });
          }}
        >
          All
        </button>
        {data.accounts
          .filter(({ type }) => type === scope.type)
          .map((account) => (
            <button
              key={account.id}
              className="chip with-logo"
              aria-pressed={scope.accountId === account.id}
              onClick={() => {
                onScope({ ...scope, accountId: account.id });
              }}
            >
              <AccountName account={account} />
              <span
                className={`dot ${freshness(account.lastSyncedAt)}`}
                title={lastSyncText(account.lastSyncedAt)}
              />
            </button>
          ))}
      </div>
      {rows.length ? (
        <div className="scroll">
          <table>
            <colgroup>
              {columns.map(({ name, width }) => (
                <col key={name} style={width ? { width } : undefined} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {columns.map(({ name, className }) => (
                  <th key={name} className={className}>
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const date = kind.date(row);
                const startsMonth = date.slice(0, 7) !== month;
                month = date.slice(0, 7);
                return (
                  <Fragment key={row.id}>
                    {startsMonth && (
                      <tr className="month">
                        <th colSpan={columns.length}>{formatMonth(date)}</th>
                      </tr>
                    )}
                    <tr
                      className={row.id === selectedId ? "selected" : undefined}
                      onClick={() => {
                        setSelectedId(row.id === selectedId ? null : row.id);
                      }}
                    >
                      {columns.map(({ name, className, cell }) => (
                        <td key={name} className={className}>
                          {cell(row)}
                        </td>
                      ))}
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <Intro
          icon={<Inbox />}
          title="No transactions yet"
          text={
            scope.accountId === null
              ? "Sync an account in the browser extension's popup."
              : "Sync this account in the browser extension's popup."
          }
        />
      )}
      {selected && selectedAccount && (
        <TransactionPanel
          account={selectedAccount}
          details={kind.details(selected)}
          onClose={() => {
            setSelectedId(null);
          }}
        />
      )}
    </>
  );
}

function Skeleton() {
  return (
    <>
      <div className="chips">
        {Array.from({ length: 4 }, (_, index) => (
          <span className="skeleton pill" key={index} />
        ))}
      </div>
      {Array.from({ length: 14 }, (_, index) => (
        <div className="skeleton-row" key={index}>
          {Array.from({ length: 5 }, (_, cell) => (
            <span className="skeleton" key={cell} />
          ))}
        </div>
      ))}
    </>
  );
}
