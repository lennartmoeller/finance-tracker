import { useMemo, useRef, useState, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDown, ArrowUp, Inbox } from "lucide-react";
import {
  accountType,
  type Account,
  type Brand,
  type CashTransaction,
  type Category,
  type DepotTransaction,
  type Transaction,
} from "@finance-tracker/shared/contract";
import { decimalSum } from "@finance-tracker/shared/decimal";
import { AccountName } from "../AccountName.tsx";
import type { Data, Loading, Scope } from "../App.tsx";
import { byId } from "../by-id.ts";
import { categoryPath } from "../category-path.ts";
import {
  capitalized,
  formatAmount,
  formatCount,
  formatDate,
  formatMoney,
  formatMonth,
  formatPlainAmount,
  formatPlainQuantity,
  formatQuantity,
} from "../format.ts";
import { Intro } from "../Intro.tsx";
import { Loaded, SkeletonRows } from "../Loaded.tsx";
import { Logo } from "../Logo.tsx";
import { literal, pattern } from "../pattern.ts";
import { PatternInput } from "../PatternInput.tsx";
import { Tabs } from "../Tabs.tsx";
import { TransactionPanel, type Field } from "./TransactionPanel.tsx";
import "./transactions.css";

type Part = CashTransaction | DepotTransaction;

type Shown<P extends Part> = {
  part: P;
  icon: ReactNode;
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
  text: (row: Row<P>) => string | null | undefined;
  cell?: (row: Row<P>) => ReactNode;
  order?: (row: Row<P>) => number | string;
};

type Kind<P extends Part> = {
  shown: (transaction: Labelled) => Shown<P> | null;
  columns: Column<P>[];
  fields: (row: Row<P>) => Field[];
};

const amountOf = ({ amount, currency }: Part) =>
  amount && currency ? formatAmount(amount, currency) : null;

const quantityOf = ({ quantity }: DepotTransaction) =>
  quantity && formatQuantity(quantity);

const named = ({ icon }: Row, text: ReactNode) => (
  <span className="named">
    {icon}
    <span>{text}</span>
  </span>
);

const dateColumn: Column<Part> = {
  name: "Date",
  width: "116px",
  className: "muted",
  text: ({ part }) => formatDate(part.date),
  order: ({ part }) => part.date,
};

const descriptionColumn: Column<Part> = {
  name: "Description",
  className: "muted",
  text: ({ part }) => part.description,
  cell: ({ part }) => part.description?.replaceAll("\n", " "),
};

const amountColumn: Column<Part> = {
  name: "Amount",
  width: "136px",
  className: "num",
  text: ({ part }) => part.amount && formatPlainAmount(part.amount),
  cell: ({ part }) => amountOf(part),
  order: ({ part }) => Number(part.amount ?? 0),
};

const accountText = ({ bank, name }: Account) => `${bank} ${name}`;

const accountColumn: Column<Part> = {
  name: "Account",
  width: "150px",
  text: ({ account }) => accountText(account),
  cell: ({ account }) => <AccountName account={account} />,
};

const cashKind: Kind<CashTransaction> = {
  shown: ({ cash, brand }) =>
    cash && {
      part: cash,
      icon: brand && <Logo src={brand.logo} name={brand.name} />,
      title: brand?.name ?? cash.counterparty,
    },
  columns: [
    dateColumn,
    accountColumn,
    {
      name: "Brand",
      width: "150px",
      text: ({ brand }) => brand?.name,
      cell: (row) => row.brand && named(row, row.brand.name),
    },
    {
      name: "Category",
      width: "140px",
      text: ({ categoryPath }) => categoryPath,
      cell: ({ category }) => category?.name,
    },
    { name: "Counterparty", text: ({ part }) => part.counterparty },
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
      icon: <Logo src={depot.securityLogo} name={depot.securityName} />,
      title: depot.securityName,
    },
  columns: [
    dateColumn,
    accountColumn,
    {
      name: "Security",
      width: "30%",
      text: ({ title, part }) => `${title ?? ""} ${part.isin}`,
      cell: (row) => named(row, row.title),
    },
    {
      name: "Type",
      width: "120px",
      text: ({ part }) => capitalized(part.type),
      cell: ({ part }) => (
        <span className="type-badge">{capitalized(part.type)}</span>
      ),
    },
    descriptionColumn,
    {
      name: "Quantity",
      width: "100px",
      className: "num",
      text: ({ part }) => part.quantity && formatPlainQuantity(part.quantity),
      cell: ({ part }) => quantityOf(part),
      order: ({ part }) => Number(part.quantity ?? 0),
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

export function Transactions({
  loading,
  scope,
  onScope,
}: {
  loading: Loading;
  scope: Scope;
  onScope: (scope: Scope) => void;
}) {
  return (
    <>
      <header className="page-head">
        <h1>Transactions</h1>
        <Tabs
          tabs={accountType.options.map((type) => [type, capitalized(type)])}
          value={scope.type}
          onChange={(type) => {
            onScope({ type });
          }}
        />
      </header>
      <div className="content">
        <Loaded loading={loading} skeleton={<SkeletonRows count={14} />}>
          {(data) =>
            scope.type === "cash" ? (
              <TransactionList kind={cashKind} data={data} scope={scope} />
            ) : (
              <TransactionList kind={depotKind} data={data} scope={scope} />
            )
          }
        </Loaded>
      </div>
    </>
  );
}

type Filter = { text: string; regex?: RegExp };

type Sort = { name: string; descending: boolean } | null;

type Item<P extends Part> = { month: string } | { row: Row<P> };

const headHeight = 64;
const monthHeight = 30;
const rowHeight = 32;

function TransactionList<P extends Part>({
  kind,
  data,
  scope,
}: {
  kind: Kind<P>;
  data: Data;
  scope: Scope;
}) {
  const { columns } = kind;
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filters, setFilters] = useState<Record<string, Filter>>(() => {
    if (!scope.account) return {};
    const text = `^${literal(accountText(scope.account))}$`;
    return { [accountColumn.name]: { text, regex: pattern(text) } };
  });
  const [sort, setSort] = useState<Sort>(null);
  const scrollBox = useRef<HTMLDivElement>(null);

  const searched = useMemo(() => {
    const accounts = byId(data.accounts);
    const brands = byId(data.brands);
    const categories = byId(data.categories);
    return data.transactions.flatMap((transaction) => {
      const category = categories.get(transaction.categoryId);
      const labelled = {
        ...transaction,
        brand: brands.get(transaction.brandId),
        category,
        categoryPath: category && categoryPath(categories, category),
      };
      const shown = kind.shown(labelled);
      const account = accounts.get(transaction.accountId);
      if (!shown || !account) return [];
      const row: Row<P> = { ...labelled, ...shown, account };
      return [{ row, texts: columns.map(({ text }) => text(row) ?? "") }];
    });
  }, [data, columns, kind]);

  const active = columns.flatMap(({ name }, index) => {
    const regex = filters[name]?.regex;
    return regex ? [[index, regex] as const] : [];
  });
  const matching = searched.filter(({ texts }) =>
    active.every(([index, regex]) => regex.test(texts[index] ?? "")),
  );
  const sortColumn = columns.find(({ name }) => name === sort?.name);
  const rows = (
    sortColumn
      ? matching.toSorted((a, b) => {
          const [x, y] = sortColumn.order
            ? [sortColumn.order(a.row), sortColumn.order(b.row)]
            : [a.texts, b.texts].map(
                (texts) => texts[columns.indexOf(sortColumn)] ?? "",
              );
          const compared =
            typeof x === "number" && typeof y === "number"
              ? x - y
              : String(x).localeCompare(String(y), "de-DE");
          return sort?.descending ? -compared : compared;
        })
      : matching
  ).map(({ row }) => row);
  const months = !sortColumn || sortColumn === dateColumn;
  const total = decimalSum(rows.flatMap(({ part }) => part.amount ?? []));
  const selected = rows.find(({ id }) => id === selectedId);
  const items = rows.flatMap((row, index): Item<P>[] =>
    months &&
    row.part.date.slice(0, 7) !== rows[index - 1]?.part.date.slice(0, 7)
      ? [{ month: row.part.date }, { row }]
      : [{ row }],
  );
  const keyOf = (item: Item<P>) =>
    "month" in item ? `month-${item.month.slice(0, 7)}` : item.row.id;

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollBox.current,
    estimateSize: (index) =>
      items[index] && "month" in items[index] ? monthHeight : rowHeight,
    getItemKey: (index) => (items[index] ? keyOf(items[index]) : index),
    overscan: 10,
    scrollMargin: headHeight,
  });

  const render = (item: Item<P>) =>
    "month" in item ? (
      <tr key={keyOf(item)} className="month">
        <th colSpan={columns.length}>{formatMonth(item.month)}</th>
      </tr>
    ) : (
      <tr
        key={keyOf(item)}
        className={item.row.id === selectedId ? "selected" : undefined}
        onClick={() => {
          setSelectedId(item.row.id === selectedId ? null : item.row.id);
        }}
      >
        {columns.map(({ name, className, text, cell }) => (
          <td key={name} className={className}>
            {cell ? cell(item.row) : text(item.row)}
          </td>
        ))}
      </tr>
    );
  const spacer = (height: number) =>
    height > 0 && (
      <tr className="spacer" aria-hidden style={{ height }}>
        <td colSpan={columns.length} />
      </tr>
    );

  const body = () => {
    const shown = virtualizer.getVirtualItems();
    const first = shown[0]?.index ?? 0;
    const isMonth = (index: number) => {
      const item = items[index];
      return item !== undefined && "month" in item;
    };
    let month = first - 1;
    while (month >= 0 && !isMonth(month)) month--;
    const stickyMonth = isMonth(first) ? undefined : items[month];
    const before = (shown[0]?.start ?? headHeight) - headHeight;
    const after =
      virtualizer.getTotalSize() -
      ((shown.at(-1)?.end ?? headHeight) - headHeight);
    return (
      <>
        {spacer(before - (stickyMonth ? monthHeight : 0))}
        {stickyMonth && render(stickyMonth)}
        {shown.map(({ index }) => items[index] && render(items[index]))}
        {spacer(after)}
      </>
    );
  };

  const toTop = () => {
    scrollBox.current?.scrollTo({ top: 0 });
  };

  const filter = (name: string, text: string) => {
    let regex: RegExp | undefined;
    try {
      regex = text ? pattern(text) : undefined;
    } catch {
      regex = filters[name]?.regex;
    }
    setFilters({ ...filters, [name]: { text, regex } });
    toTop();
  };

  return (
    <>
      {searched.length ? (
        <div className="scroll" ref={scrollBox}>
          <table>
            <colgroup>
              {columns.map(({ name, width }) => (
                <col key={name} style={{ width }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {columns.map(({ name, className }) => (
                  <th
                    key={name}
                    className={className}
                    aria-sort={
                      sort?.name === name
                        ? sort.descending
                          ? "descending"
                          : "ascending"
                        : undefined
                    }
                  >
                    <button
                      className="sort"
                      onClick={() => {
                        toTop();
                        setSort(
                          sort?.name !== name
                            ? { name, descending: false }
                            : sort.descending
                              ? null
                              : { name, descending: true },
                        );
                      }}
                    >
                      {name}
                      {sort?.name === name &&
                        (sort.descending ? <ArrowDown /> : <ArrowUp />)}
                    </button>
                  </th>
                ))}
              </tr>
              <tr className="filters">
                {columns.map(({ name, className }) => (
                  <th key={name} className={className}>
                    <PatternInput
                      label={`Filter ${name}`}
                      value={filters[name]?.text ?? ""}
                      onChange={(text) => {
                        filter(name, text);
                      }}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                body()
              ) : (
                <tr className="no-match">
                  <td colSpan={columns.length}>No matching transactions</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                {columns.map(({ name, className }, index) => (
                  <td key={name} className={className}>
                    {index === 0
                      ? `${formatCount(rows.length)} of ${formatCount(searched.length)}`
                      : name === amountColumn.name && formatMoney(total)}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <Intro
          icon={<Inbox />}
          title="No transactions yet"
          text="Sync an account in the browser extension's popup."
        />
      )}
      {selected && (
        <TransactionPanel
          account={selected.account}
          date={selected.part.date}
          amount={amountOf(selected.part)}
          icon={selected.icon}
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
