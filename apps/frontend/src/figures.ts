import type {
  DepotTransaction,
  Price,
  Transaction,
} from "@finance-tracker/shared/contract";
import {
  decimalProduct,
  decimalSum,
  negated,
} from "@finance-tracker/shared/decimal";

export type DepotFigures = {
  invested: string;
  purchases: string;
} & (
  | { marketValue: string; reinvested: string; paidOut: string; gain: string }
  | { unpriced: string[] }
);

export type DayValues = {
  date: string;
  marketValue: number | null;
  invested: number;
  gain: number | null;
};

type PriceOn = (isin: string, day?: string) => string | undefined;

const nextDay = (day: string, days = 1) =>
  new Date(Date.parse(`${day}T00:00Z`) + days * 86_400_000)
    .toISOString()
    .slice(0, 10);

function latestPrices(prices: Price[]): PriceOn {
  const bySecurity = Map.groupBy(
    prices.toSorted((a, b) => a.date.localeCompare(b.date)),
    ({ isin }) => isin,
  );
  return (isin, day) => {
    const ofSecurity = bySecurity.get(isin) ?? [];
    if (day === undefined) return ofSecurity.at(-1)?.price;
    let [low, high] = [0, ofSecurity.length];
    while (low < high) {
      const middle = (low + high) >> 1;
      if ((ofSecurity[middle]?.date ?? "") <= day) low = middle + 1;
      else high = middle;
    }
    return ofSecurity[low - 1]?.price;
  };
}

export const lastSale = (transactions: DepotTransaction[]) =>
  transactions.reduce(
    (latest, { date, quantity }) =>
      Number(quantity) < 0 && date > latest ? date : latest,
    "",
  );

export const shares = (transactions: DepotTransaction[]) =>
  decimalSum(transactions.flatMap(({ quantity }) => quantity ?? []));

function holdings(transactions: DepotTransaction[]) {
  const names = new Map(
    transactions.map(({ isin, securityName }) => [isin, securityName]),
  );
  return [...names].flatMap(([isin, name]) => {
    const held = shares(transactions.filter((other) => other.isin === isin));
    return Number(held) > 0 ? [{ isin, name, shares: held }] : [];
  });
}

function positionOf(transactions: DepotTransaction[]) {
  const amounts = (counts: (transaction: DepotTransaction) => boolean) =>
    decimalSum(
      transactions.flatMap((transaction) =>
        counts(transaction) && transaction.amount ? [transaction.amount] : [],
      ),
    );
  return {
    invested: amounts(({ type }) => type === "trade"),
    purchases: amounts(
      ({ type, quantity }) => type === "trade" && Number(quantity) > 0,
    ),
    distributions: amounts(({ type }) => type === "distribution"),
    holdings: holdings(transactions),
    reinvestments: transactions.filter(({ type }) => type === "reinvestment"),
  };
}

function figuresOn(
  {
    invested,
    purchases,
    distributions,
    holdings,
    reinvestments,
  }: ReturnType<typeof positionOf>,
  priceOn: PriceOn,
  day?: string,
): DepotFigures {
  const unpriced = new Set<string>();
  const value = (isin: string, name: string, quantity: string, on?: string) => {
    const price = priceOn(isin, on);
    if (price) return decimalProduct(quantity, price);
    unpriced.add(name);
    return "0";
  };
  const marketValue = decimalSum(
    holdings.map(({ isin, name, shares }) => value(isin, name, shares, day)),
  );
  const reinvested = decimalSum(
    reinvestments.map(({ isin, securityName, quantity, date }) =>
      value(isin, securityName, quantity ?? "0", date),
    ),
  );
  if (unpriced.size) return { invested, purchases, unpriced: [...unpriced] };
  const notReinvested = decimalSum([distributions, negated(reinvested)]);
  return {
    invested,
    purchases,
    marketValue,
    reinvested,
    paidOut: Number(notReinvested) > 0 ? notReinvested : "0",
    gain: decimalSum([marketValue, negated(invested)]),
  };
}

export const priced = (figures: DepotFigures | null) =>
  figures && "marketValue" in figures ? figures : null;

export const withoutPrices = (names: string[]) =>
  `Without ${names.join(", ")}, whose prices are missing.`;

export function balance(transactions: Transaction[]): string | null {
  const amounts = transactions.flatMap(({ cash }) => cash?.amount ?? []);
  return amounts.length ? decimalSum(amounts) : null;
}

export const depotFigures = (
  transactions: DepotTransaction[],
  prices: Price[],
): DepotFigures | null =>
  transactions.length
    ? figuresOn(positionOf(transactions), latestPrices(prices))
    : null;

export function dailyValues(
  transactions: DepotTransaction[],
  prices: Price[],
): DayValues[] {
  const dates = new Set(transactions.map(({ date }) => date));
  const [first, ...rest] = [...dates].sort();
  if (!first) return [];
  const latestPrice = prices.reduce(
    (latest, { date }) => (date > latest ? date : latest),
    rest.at(-1) ?? first,
  );
  const end = holdings(transactions).length
    ? latestPrice
    : nextDay(lastSale(transactions), -1);
  const priceOn = latestPrices(prices);
  const values: DayValues[] = [];
  let position = positionOf([]);
  for (let day = first; day <= end; day = nextDay(day)) {
    if (dates.has(day))
      position = positionOf(transactions.filter(({ date }) => date <= day));
    const figures = figuresOn(position, priceOn, day);
    const priced = "marketValue" in figures;
    values.push({
      date: day,
      marketValue: priced ? Number(figures.marketValue) : null,
      invested: Number(figures.invested),
      gain: priced ? Number(figures.gain) : null,
    });
  }
  return values;
}
