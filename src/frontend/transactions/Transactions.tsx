import { Fragment, useState, type ReactNode } from "react";
import { Inbox } from "lucide-react";
import {
  accountType,
  type Account,
  type Brand,
  type CashTransaction,
  type Category,
  type DepotTransaction,
  type Transaction,
} from "@finance-tracker/shared/contract";
import { syncedBy } from "@finance-tracker/shared/bank";
import { freshness, lastSyncText } from "@finance-tracker/shared/last-sync";
import { AccountName } from "../AccountName.tsx";
import type { Data, Loading, Scope } from "../App.tsx";
import { banks } from "../banks.ts";
import { byId } from "../by-id.ts";
import { categoryPath } from "../category-path.ts";
import {
  formatAmount,
  formatDate,
  formatMonth,
  formatQuantity,
} from "../format.ts";
import { Intro } from "../Intro.tsx";
import { Loaded, SkeletonRows } from "../Loaded.tsx";
import { Logo } from "../Logo.tsx";
import { none } from "../none.tsx";
import { Tabs } from "../Tabs.tsx";
import { TransactionPanel, type Field } from "./TransactionPanel.tsx";
import "./transactions.css";

type Part = CashTransaction | DepotTransaction;

type Shown<P extends Part> = {
  part: P;
  logo: string | null;
  title: string | null;
};

type Labelled = Transaction & {
  brand: Brand | undefined;
  category: Category | undefined;
  categoryPath: string | undefined;
};

type Row<P extends Part = Part> = Labelled & Shown<P> & { account: Account };

type Column<P extends Part> = {
  name: string;
  width?: string;
  className?: string;
  cell: (row: Row<P>) => ReactNode;
};

type Kind<P extends Part> = {
  shown: (transaction: Labelled) => Shown<P> | null;
  columns: Column<P>[];
  fields: (row: Row<P>) => Field[];
};

const capitalized = (term: string) =>
  term.charAt(0).toUpperCase() + term.slice(1);

const amountOf = ({ amount, currency }: Part) =>
  amount && currency ? formatAmount(amount, currency) : null;

const quantityOf = ({ quantity }: DepotTransaction) =>
  quantity && formatQuantity(quantity);

const named = ({ logo, title }: Row, text: ReactNode) => (
  <span className="named">
    <Logo src={logo} name={title} />
    <span>{text}</span>
  </span>
);

const dateColumn: Column<Part> = {
  name: "Date",
  width: "116px",
  className: "muted",
  cell: ({ part }) => formatDate(part.date),
};

const descriptionColumn: Column<Part> = {
  name: "Description",
  className: "muted",
  cell: ({ part }) => part.description?.replaceAll("\n", " "),
};

const amountColumn: Column<Part> = {
  name: "Amount",
  width: "120px",
  className: "num",
  cell: ({ part }) => amountOf(part),
};

const accountColumn: Column<Part> = {
  name: "Account",
  width: "150px",
  cell: ({ account }) => <AccountName account={account} />,
};

const cashKind: Kind<CashTransaction> = {
  shown: ({ cash, brand }) =>
    cash && {
      part: cash,
      logo: brand?.logo ?? null,
      title: brand?.name ?? cash.counterparty,
    },
  columns: [
    dateColumn,
    {
      name: "Brand",
      width: "150px",
      cell: (row) => named(row, row.brand?.name ?? none),
    },
    {
      name: "Category",
      width: "140px",
      cell: ({ category }) => category?.name,
    },
    { name: "Counterparty", cell: ({ part }) => part.counterparty },
    descriptionColumn,
    amountColumn,
  ],
  fields: ({ part, brand, categoryPath }) => [
    ["Brand", brand?.name],
    ["Category", categoryPath],
    ["Counterparty", part.counterparty],
    ["Description", part.description],
  ],
};

const depotKind: Kind<DepotTransaction> = {
  shown: ({ depot }) =>
    depot && {
      part: depot,
      logo: depot.securityLogo,
      title: depot.securityName,
    },
  columns: [
    dateColumn,
    { name: "Security", width: "30%", cell: (row) => named(row, row.title) },
    {
      name: "Type",
      width: "120px",
      cell: ({ part }) => (
        <span className="type-badge">{capitalized(part.type)}</span>
      ),
    },
    descriptionColumn,
    {
      name: "Quantity",
      width: "100px",
      className: "num",
      cell: ({ part }) => quantityOf(part),
    },
    amountColumn,
  ],
  fields: ({ part }) => [
    ["Security", part.securityName],
    ["ISIN", <span className="isin">{part.isin}</span>],
    ["Type", capitalized(part.type)],
    ["Quantity", quantityOf(part)],
    ["Description", part.description],
  ],
};

const skeleton = (
  <>
    <div className="chips">
      {Array.from({ length: 4 }, (_, index) => (
        <span key={index} className="skeleton" />
      ))}
    </div>
    <SkeletonRows count={14} />
  </>
);

type ScopeProps = { scope: Scope; onScope: (scope: Scope) => void };

export function Transactions({
  loading,
  scope,
  onScope,
}: ScopeProps & { loading: Loading }) {
  return (
    <>
      <header className="page-head">
        <h1>Transactions</h1>
        <Tabs
          tabs={accountType.options.map((type) => [type, capitalized(type)])}
          value={scope.type}
          onChange={(type) => {
            onScope({ type, accountId: null });
          }}
        />
      </header>
      <div className="content">
        <Loaded loading={loading} skeleton={skeleton}>
          {(data) =>
            scope.type === "cash" ? (
              <TransactionList
                kind={cashKind}
                data={data}
                scope={scope}
                onScope={onScope}
              />
            ) : (
              <TransactionList
                kind={depotKind}
                data={data}
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

function TransactionList<P extends Part>({
  kind,
  data,
  scope,
  onScope,
}: ScopeProps & { kind: Kind<P>; data: Data }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const ofType = data.accounts.filter(({ type }) => type === scope.type);
  const scoped = new Map(
    ofType
      .filter(({ id }) => scope.accountId === null || id === scope.accountId)
      .map((account) => [account.id, account]),
  );
  const brands = byId(data.brands);
  const categories = byId(data.categories);
  const rows = data.transactions.flatMap((transaction): Row<P>[] => {
    const category = categories.get(transaction.categoryId);
    const labelled = {
      ...transaction,
      brand: brands.get(transaction.brandId),
      category,
      categoryPath: category && categoryPath(categories, category),
    };
    const shown = kind.shown(labelled);
    const account = scoped.get(transaction.accountId);
    return shown && account ? [{ ...labelled, ...shown, account }] : [];
  });
  const columns =
    scope.accountId === null
      ? kind.columns.toSpliced(-1, 0, accountColumn)
      : kind.columns;
  const selected = rows.find(({ id }) => id === selectedId);

  const chip = (accountId: number | null, label: ReactNode) => (
    <button
      key={accountId}
      className="chip"
      aria-pressed={scope.accountId === accountId}
      onClick={() => {
        onScope({ ...scope, accountId });
      }}
    >
      {label}
    </button>
  );

  return (
    <>
      <div className="chips" role="group" aria-label="Account">
        {chip(null, "All")}
        {ofType.map((account) =>
          chip(
            account.id,
            <>
              <AccountName account={account} />
              {syncedBy(banks, account) && (
                <span
                  className={`dot ${freshness(account.lastSyncedAt)}`}
                  title={lastSyncText(account.lastSyncedAt)}
                />
              )}
            </>,
          ),
        )}
      </div>
      {rows.length ? (
        <div className="scroll">
          <table>
            <colgroup>
              {columns.map(({ name, width }) => (
                <col key={name} style={{ width }} />
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
              {rows.map((row, index) => (
                <Fragment key={row.id}>
                  {row.part.date.slice(0, 7) !==
                    rows[index - 1]?.part.date.slice(0, 7) && (
                    <tr className="month">
                      <th colSpan={columns.length}>
                        {formatMonth(row.part.date)}
                      </th>
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
                        {cell(row) ?? none}
                      </td>
                    ))}
                  </tr>
                </Fragment>
              ))}
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
      {selected && (
        <TransactionPanel
          account={selected.account}
          date={selected.part.date}
          amount={amountOf(selected.part)}
          logo={selected.logo}
          title={selected.title}
          fields={kind.fields(selected)}
          onClose={() => {
            setSelectedId(null);
          }}
        />
      )}
    </>
  );
}
