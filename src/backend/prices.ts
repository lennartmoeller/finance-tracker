import { ORPCError } from "@orpc/server";
import type { Pool } from "pg";
import { errorMessage } from "@finance-tracker/shared/error-message";
import type { Price } from "@finance-tracker/shared/contract";
import { decimalSum } from "@finance-tracker/shared/decimal";
import { fetchPrices } from "./onvista.ts";

type HoldingSpan = { isin: string; from: string; to: string };

// A span starting on a weekend or holiday takes the price of the trading day before it, and no exchange closes for a week.
const daysBeforeFirstPrice = 7;

const shifted = (date: string, days: number) =>
  Temporal.PlainDate.from(date).add({ days }).toString();

const weekdayAfter = (date: string, through: string) =>
  Array.from(
    { length: Temporal.PlainDate.from(date).until(through).days },
    (_, index) => Temporal.PlainDate.from(date).add({ days: index + 1 }),
  ).some((day) => day.dayOfWeek < 6);

export function holdingSpans(
  depotQuantities: { isin: string; date: string; quantity: string | null }[],
  yesterday: string,
): HoldingSpan[] {
  const bySecurity = Map.groupBy(
    depotQuantities.toSorted((a, b) => a.date.localeCompare(b.date)),
    ({ isin }) => isin,
  );
  return [...bySecurity].flatMap(([isin, ofSecurity]) => {
    const spans: HoldingSpan[] = [];
    let shares = "0";
    let from: string | undefined;
    for (const [date, ofDay] of Map.groupBy(ofSecurity, ({ date }) => date)) {
      shares = decimalSum([
        shares,
        ...ofDay.flatMap(({ quantity }) => quantity ?? []),
      ]);
      const held = Number(shares) > 0;
      if (held && !from) from = date;
      if (!held && from) {
        spans.push({ isin, from, to: shifted(date, -1) });
        from = undefined;
      }
    }
    if (from && from <= yesterday) spans.push({ isin, from, to: yesterday });
    return spans;
  });
}

async function fillSpan(db: Pool, { isin, from, to }: HoldingSpan) {
  const earliest = shifted(from, -daysBeforeFirstPrice);
  const [latest] = (
    await db.query<{ date: string | null }>(
      "select max(date) as date from prices where isin = $1 and date between $2 and $3",
      [isin, earliest, to],
    )
  ).rows;
  const last = latest?.date;
  if (last && !weekdayAfter(last, to)) return 0;
  const fetched = (
    await fetchPrices(isin, last ? shifted(last, 1) : earliest)
  ).filter(({ date }) => date <= to);
  const missing = fetched.slice(
    Math.max(
      fetched.findLastIndex(({ date }) => date <= from),
      0,
    ),
  );
  const { rowCount } = await db.query(
    `insert into prices (isin, date, price)
    select $1, date, price from jsonb_to_recordset($2::jsonb) as price(date date, price numeric)
    on conflict do nothing`,
    [isin, JSON.stringify(missing)],
  );
  return rowCount ?? 0;
}

export async function fillPrices(db: Pool) {
  const yesterday = Temporal.Now.plainDateISO("Europe/Berlin")
    .subtract({ days: 1 })
    .toString();
  const spans = holdingSpans(
    (
      await db.query<{ isin: string; date: string; quantity: string | null }>(
        "select isin, date, quantity from depot_transactions",
      )
    ).rows,
    yesterday,
  );
  let stored = 0;
  const failures: string[] = [];
  for (const [isin, ofSecurity] of Map.groupBy(spans, ({ isin }) => isin)) {
    try {
      for (const span of ofSecurity) stored += await fillSpan(db, span);
    } catch (error) {
      failures.push(`${isin}: ${errorMessage(error)}`);
    }
  }
  if (failures.length)
    throw new ORPCError("BAD_GATEWAY", { message: failures.join("\n") });
  return { stored };
}

export const listPrices = async (db: Pool) =>
  (await db.query<Price>("select isin, date, price from prices")).rows;
