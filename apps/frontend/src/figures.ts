import type {
  DepotTransaction,
  Price,
  Transaction,
} from "@finance-tracker/shared/contract";
import { decimalProduct, decimalSum } from "@finance-tracker/shared/decimal";

export type DepotFigures = {
  invested: string;
  purchases: string;
  distributions: string;
} & (
  | {
      marketValue: string;
      reinvested: string;
      paidOut: string;
      gain: string;
    }
  | { unpriced: string[] }
);

export type DayValues = {
  date: string;
  marketValue: number | null;
  invested: number;
  gain: number | null;
};

type PriceOf = (isin: string, day?: string) => string | undefined;

const sum = (values: string[]) => decimalSum(["0", ...values]);

const negated = (value: string) =>
  value.startsWith("-") ? value.slice(1) : `-${value}`;

const shifted = (day: string, days: number) =>
  new Date(Date.parse(`${day}T00:00Z`) + days * 86_400_000)
    .toISOString()
    .slice(0, 10);

function priceLookup(prices: Price[]): PriceOf {
  const byIsin = Map.groupBy(
    prices.toSorted((a, b) => a.date.localeCompare(b.date)),
    ({ isin }) => isin,
  );
  return (isin, day) => {
    const ofSecurity = byIsin.get(isin) ?? [];
    let [low, high] = [0, ofSecurity.length];
    while (day !== undefined && low < high) {
      const middle = (low + high) >> 1;
      if ((ofSecurity[middle]?.date ?? "") <= day) low = middle + 1;
      else high = middle;
    }
    return ofSecurity[high - 1]?.price;
  };
}

export const shares = (transactions: DepotTransaction[]) =>
  sum(transactions.flatMap(({ quantity }) => quantity ?? []));

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
  const amounts = (select: (transaction: DepotTransaction) => boolean) =>
    sum(
      transactions.flatMap((transaction) =>
        select(transaction) && transaction.amount ? [transaction.amount] : [],
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
  priceOf: PriceOf,
  day?: string,
): DepotFigures {
  const unpriced = new Set<string>();
  const value = (isin: string, name: string, quantity: string, on = day) => {
    const price = priceOf(isin, on);
    if (price) return decimalProduct(quantity, price);
    unpriced.add(name);
    return "0";
  };
  const marketValue = sum(
    holdings.map(({ isin, name, shares }) => value(isin, name, shares)),
  );
  const reinvested = sum(
    reinvestments.map(({ isin, securityName, quantity, date }) =>
      value(isin, securityName, quantity ?? "0", date),
    ),
  );
  if (unpriced.size)
    return { invested, purchases, distributions, unpriced: [...unpriced] };
  const gain = decimalSum([marketValue, negated(invested)]);
  const notReinvested = decimalSum([distributions, negated(reinvested)]);
  // Reinvested shares are valued at the exchange's close, not at what the bank paid for them, so they can exceed their distribution by cents.
  const paidOut = Number(notReinvested) > 0 ? notReinvested : "0";
  return {
    invested,
    purchases,
    distributions,
    marketValue,
    reinvested,
    paidOut,
    gain,
  };
}

export function balance(transactions: Transaction[]): string | null {
  const amounts = transactions.flatMap(({ cash }) =>
    cash ? [cash.amount] : [],
  );
  return amounts.length ? decimalSum(amounts) : null;
}

export const depotFigures = (
  transactions: DepotTransaction[],
  prices: Price[],
): DepotFigures | null =>
  transactions.length
    ? figuresOn(positionOf(transactions), priceLookup(prices))
    : null;

export function dailyValues(
  transactions: DepotTransaction[],
  prices: Price[],
): DayValues[] {
  const priceOf = priceLookup(prices);
  const dates = transactions.map(({ date }) => date).sort();
  const [first] = dates;
  const last = dates.at(-1);
  if (!first || !last) return [];
  const latestPrice = prices.reduce(
    (latest, { date }) => (date > latest ? date : latest),
    last,
  );
  const lastSale = transactions.reduce(
    (latest, { date, quantity }) =>
      Number(quantity) < 0 && date > latest ? date : latest,
    first,
  );
  const end = holdings(transactions).length
    ? latestPrice
    : shifted(lastSale, -1);
  const values: DayValues[] = [];
  let position = positionOf([]);
  for (let day = first; day <= end; day = shifted(day, 1)) {
    if (dates.includes(day))
      position = positionOf(transactions.filter(({ date }) => date <= day));
    const figures = figuresOn(position, priceOf, day);
    values.push({
      date: day,
      invested: Number(figures.invested),
      ...("marketValue" in figures
        ? {
            marketValue: Number(figures.marketValue),
            gain: Number(figures.gain),
          }
        : { marketValue: null, gain: null }),
    });
  }
  return values;
}
