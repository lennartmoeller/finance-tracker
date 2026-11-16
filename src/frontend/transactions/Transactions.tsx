import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowRight,
  ArrowUp,
  Inbox,
} from "lucide-react";
import {
  groupAccountNumber,
  iban,
} from "@finance-tracker/shared/account-number";
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
import { accountText } from "../account-text.ts";
import type { Change, Data, Loading } from "../App.tsx";
import { bankLogo } from "../banks.ts";
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
import { pattern } from "../pattern.ts";
import { PatternInput } from "../PatternInput.tsx";
import { href, type Route, type Sort, type TransferFilter } from "../route.ts";
import { Tabs } from "../Tabs.tsx";
import {
  TransactionPanel,
  type Field,
  type PanelSide,
} from "./TransactionPanel.tsx";
import { probableText, TransferSection } from "./TransferSection.tsx";
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

export type Row<P extends Part = Part> = Labelled &
  Shown<P> & {
    account: Account;
    partner: Side | undefined;
    suggested: Side | undefined;
    merged: boolean;
  };

type Side = { row: Row; fields: () => Field[] };

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

const amountOf = (
  { amount, currency }: Part,
  signDisplay?: "exceptZero" | "never",
) => (amount && currency ? formatAmount(amount, currency, signDisplay) : null);

const transferIcon = (
  <span className="logo letter">
    <ArrowLeftRight />
  </span>
);

const sends = ({ part }: Row) => part.amount?.startsWith("-") ?? false;

const unlessTransfer = ({ transferPartnerId }: Row, text: string | null) =>
  transferPartnerId === null ? text : null;

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
  text: (row) => unlessTransfer(row, row.part.description),
  cell: (row) =>
    unlessTransfer(row, row.part.description)?.replaceAll("\n", " "),
};

const amountColumn: Column<Part> = {
  name: "Amount",
  width: "136px",
  className: "num",
  text: ({ part }) => part.amount && formatPlainAmount(part.amount),
  cell: ({ part, merged }) =>
    merged ? (
      <span className="transfer-amount">{amountOf(part, "never")}</span>
    ) : (
      amountOf(part)
    ),
  order: ({ part, merged }) => Number(part.amount ?? 0) * (merged ? -1 : 1),
};

const accountColumn: Column<Part> = {
  name: "Account",
  width: "260px",
  text: ({ account }) => accountText(account),
  cell: (row) => {
    const own = <AccountName account={row.account} />;
    if (row.partner) {
      const partner = <AccountName account={row.partner.row.account} />;
      return (
        <span className="named">
          {sends(row) ? own : partner}
          <ArrowRight className="transfer-arrow" />
          {sends(row) ? partner : own}
        </span>
      );
    }
    const bank = row.probableTransfer?.bank;
    const target = row.suggested ? (
      <AccountName account={row.suggested.row.account} />
    ) : (
      bank && (
        <span className="named">
          <img className="bank" src={bankLogo(bank)} alt="" />
          <span>{bank}?</span>
        </span>
      )
    );
    if (!target) return own;
    const arrow = <ArrowRight className="transfer-arrow probable" />;
    return (
      <span
        className="named"
        title={`Probably a transfer: ${probableText(row) ?? ""}`}
      >
        {sends(row) ? (
          <>
            {own}
            <span className="named suggested">
              {arrow}
              {target}
            </span>
          </>
        ) : (
          <>
            <span className="named suggested">
              {target}
              {arrow}
            </span>
            {own}
          </>
        )}
      </span>
    );
  },
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
    {
      name: "Counterparty",
      text: (row) => unlessTransfer(row, row.part.counterparty),
    },
    descriptionColumn,
    amountColumn,
  ],
  fields: ({ part, brand, categoryPath, transferPartnerId }) => [
    ...(transferPartnerId === null
      ? ([
          ["Brand", brand?.name],
          ["Category", categoryPath],
        ] satisfies Field[])
      : []),
    ["Counterparty", part.counterparty],
    ...(part.counterpartyIban
      ? ([
          [
            "IBAN",
            <span className="isin">
              {groupAccountNumber(part.counterpartyIban, iban.groups)}
            </span>,
          ],
        ] satisfies Field[])
      : []),
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

type TransactionsRoute = Extract<Route, { view: "transactions" }>;

const tabHref = (tab: Account["type"]) =>
  href({ view: "transactions", tab, filters: {}, sort: null, transfers: null });

const transferChoices: [TransferFilter | null, string][] = [
  [null, "All"],
  ["only", "Transfers"],
  ["probable", "Probable"],
  ["none", "No transfers"],
];

const shownBy = (transfers: TransferFilter | null) => (row: Row) =>
  transfers === null ||
  (transfers === "only"
    ? row.partner !== undefined
    : row.partner === undefined &&
      (transfers === "none" || row.probableTransfer !== null));

export function Transactions({
  loading,
  route,
  onChange,
}: {
  loading: Loading;
  route: TransactionsRoute;
  onChange: Change;
}) {
  return (
    <>
      <header className="page-head">
        <h1>Transactions</h1>
        <Tabs
          tabs={accountType.options.map((type) => [
            tabHref(type),
            capitalized(type),
          ])}
          value={tabHref(route.tab)}
        />
        <nav className="transfer-switch" aria-label="Transfers">
          {transferChoices.map(([transfers, label]) => (
            <a
              key={label}
              href={href({ ...route, transfers })}
              aria-current={route.transfers === transfers || undefined}
            >
              {label}
            </a>
          ))}
        </nav>
      </header>
      <div className="content">
        <Loaded loading={loading} skeleton={<SkeletonRows count={14} />}>
          {(data) =>
            route.tab === "cash" ? (
              <TransactionList
                kind={cashKind}
                data={data}
                route={route}
                onChange={onChange}
              />
            ) : (
              <TransactionList
                kind={depotKind}
                data={data}
                route={route}
                onChange={onChange}
              />
            )
          }
        </Loaded>
      </div>
    </>
  );
}

const paramOf = (name: string) => name.toLowerCase();

type Item<P extends Part> = { month: string } | { row: Row<P> };

type Searched<P extends Part> = { row: Row<P>; texts: string[] };

const headHeight = 64;
const monthHeight = 30;
const rowHeight = 32;

function TransactionList<P extends Part>({
  kind,
  data,
  route,
  onChange,
}: {
  kind: Kind<P>;
  data: Data;
  route: TransactionsRoute;
  onChange: Change;
}) {
  const { columns } = kind;
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const lastValidRegexes = useRef(new Map<string, RegExp>());
  const scrollBox = useRef<HTMLDivElement>(null);
  const address = href(route);

  useEffect(() => {
    scrollBox.current?.scrollTo({ top: 0 });
  }, [address]);

  const { sides, searched } = useMemo(() => {
    const accounts = byId(data.accounts);
    const brands = byId(data.brands);
    const categories = byId(data.categories);
    const sides = new Map(
      data.transactions.flatMap((transaction) => {
        const category = categories.get(transaction.categoryId);
        const labelled = {
          ...transaction,
          brand: brands.get(transaction.brandId),
          category,
          categoryPath: category && categoryPath(categories, category),
        };
        const account = accounts.get(transaction.accountId);
        const side =
          account &&
          (sideOf(cashKind, labelled, account) ??
            sideOf(depotKind, labelled, account));
        return side ? [[transaction.id, side] as const] : [];
      }),
    );
    const sideById = (id: number | null | undefined) =>
      id === null || id === undefined ? undefined : sides.get(id);
    for (const { row } of sides.values()) {
      row.partner = sideById(row.transferPartnerId);
      row.suggested = sideById(row.probableTransfer?.partnerId);
    }
    return {
      sides: [...sides.values()].map(({ row }) => row),
      searched: [...sides.values()].flatMap(({ row: side }) => {
        const shown = kind.shown(side);
        if (!shown) return [];
        const row: Row<P> = { ...side, ...shown };
        return [{ row, texts: columns.map(({ text }) => text(row) ?? "") }];
      }),
    };
  }, [data, columns, kind]);
  const inScope = useMemo(() => mergedTransfers(searched).length, [searched]);

  const filterOf = (name: string) => route.filters[paramOf(name)] ?? "";
  const regexOf = (name: string) => {
    try {
      const regex = pattern(filterOf(name));
      lastValidRegexes.current.set(name, regex);
      return regex;
    } catch {
      return lastValidRegexes.current.get(name);
    }
  };
  const active = columns.flatMap(({ name }, index) => {
    const regex = regexOf(name);
    return filterOf(name) && regex ? [[index, regex] as const] : [];
  });
  const sortOf = (name: string) =>
    route.sort?.column === paramOf(name) ? route.sort : null;
  const nextSort = (name: string): Sort | null =>
    !sortOf(name)
      ? { column: paramOf(name), descending: false }
      : sortOf(name)?.descending
        ? null
        : { column: paramOf(name), descending: true };
  const shown = shownBy(route.transfers);
  const matching = searched.filter(
    ({ row, texts }) =>
      shown(row) &&
      active.every(([index, regex]) => regex.test(texts[index] ?? "")),
  );
  const merged = mergedTransfers(matching);
  const sortColumn = columns.find(({ name }) => sortOf(name));
  const rows = (
    sortColumn
      ? merged.toSorted((a, b) => {
          const [x, y] = sortColumn.order
            ? [sortColumn.order(a.row), sortColumn.order(b.row)]
            : [a.texts, b.texts].map(
                (texts) => texts[columns.indexOf(sortColumn)] ?? "",
              );
          const compared =
            typeof x === "number" && typeof y === "number"
              ? x - y
              : String(x).localeCompare(String(y), "de-DE");
          return route.sort?.descending ? -compared : compared;
        })
      : merged
  ).map(({ row }) => row);
  const months = !sortColumn || sortColumn === dateColumn;
  const total = decimalSum(
    matching.flatMap(({ row }) => row.part.amount ?? []),
  );
  const isSelected = ({ id, partner }: Row) =>
    selectedId !== null &&
    (id === selectedId || partner?.row.id === selectedId);
  const selected = rows.find(isSelected);
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
        className={isSelected(item.row) ? "selected" : undefined}
        onClick={() => {
          setSelectedId(isSelected(item.row) ? null : item.row.id);
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

  const filter = (name: string, text: string) => {
    history.replaceState(
      null,
      "",
      href({ ...route, filters: { ...route.filters, [paramOf(name)]: text } }),
    );
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
                      sortOf(name)
                        ? sortOf(name)?.descending
                          ? "descending"
                          : "ascending"
                        : undefined
                    }
                  >
                    <a
                      className="sort"
                      href={href({ ...route, sort: nextSort(name) })}
                    >
                      {name}
                      {sortOf(name) &&
                        (sortOf(name)?.descending ? (
                          <ArrowDown />
                        ) : (
                          <ArrowUp />
                        ))}
                    </a>
                  </th>
                ))}
              </tr>
              <tr className="filters">
                {columns.map(({ name, className }) => (
                  <th key={name} className={className}>
                    <PatternInput
                      label={`Filter ${name}`}
                      value={filterOf(name)}
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
                      ? `${formatCount(rows.length)} of ${formatCount(inScope)}`
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
          icon={selected.partner ? transferIcon : selected.icon}
          title={selected.partner ? "Transfer" : selected.title}
          amount={amountOf(selected.part, selected.partner && "never")}
          transfer={
            <TransferSection
              key={selected.id}
              row={selected}
              rows={sides}
              onChange={onChange}
            />
          }
          sides={panelSides(kind, selected)}
          onClose={() => {
            setSelectedId(null);
          }}
        />
      )}
    </>
  );
}

function sideOf<P extends Part>(
  kind: Kind<P>,
  labelled: Labelled,
  account: Account,
): Side | undefined {
  const shown = kind.shown(labelled);
  if (!shown) return undefined;
  const row: Row<P> = {
    ...labelled,
    ...shown,
    account,
    partner: undefined,
    suggested: undefined,
    merged: false,
  };
  return { row, fields: () => kind.fields(row) };
}

function mergedTransfers<P extends Part>(listed: Searched<P>[]) {
  const ids = new Set(listed.map(({ row }) => row.id));
  return listed.flatMap((item) =>
    !item.row.partner || !ids.has(item.row.partner.row.id)
      ? [item]
      : sends(item.row)
        ? [{ ...item, row: { ...item.row, merged: true } }]
        : [],
  );
}

function panelSides<P extends Part>(
  kind: Kind<P>,
  row: Row<P>,
): [PanelSide] | [from: PanelSide, to: PanelSide] {
  const sideOfRow = ({ account, part }: Row, fields: Field[]) => ({
    account,
    date: part.date,
    fields,
  });
  const own = sideOfRow(row, kind.fields(row));
  if (!row.partner) return [own];
  const partner = sideOfRow(row.partner.row, row.partner.fields());
  return sends(row) ? [own, partner] : [partner, own];
}
