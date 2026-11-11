import { ORPCError } from "@orpc/server";
import { and, between, eq, max } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { errorMessage } from "@finance-tracker/shared/client";
import { decimalSum } from "@finance-tracker/shared/decimal";
import { fetchPrices } from "./onvista.ts";
import { depotTransactions, prices } from "./schema.ts";

type HoldingSpan = { isin: string; from: string; to: string };

// A span starting on a weekend or holiday takes the price of the trading day before it, and no exchange closes for a week.
const daysBeforeFirstPrice = 7;

const shifted = (date: string, days: number) =>
  Temporal.PlainDate.from(date).add({ days }).toString();

function weekdayAfter(date: string, through: string) {
  const start = Temporal.PlainDate.from(date);
  return Array.from({ length: start.until(through).days }, (_, index) =>
    start.add({ days: index + 1 }),
  ).some((day) => day.dayOfWeek < 6);
}

export function holdingSpans(
  depotQuantities: { isin: string; date: string; quantity: string | null }[],
  yesterday: string,
): HoldingSpan[] {
  const spans: HoldingSpan[] = [];
  for (const [isin, ofSecurity] of Map.groupBy(
    depotQuantities.toSorted((a, b) => a.date.localeCompare(b.date)),
    ({ isin }) => isin,
  )) {
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
  }
  return spans;
}

export async function fillPrices(db: NodePgDatabase) {
  const yesterday = Temporal.Now.plainDateISO("Europe/Berlin")
    .subtract({ days: 1 })
    .toString();
  const spans = holdingSpans(
    await db
      .select({
        isin: depotTransactions.isin,
        date: depotTransactions.date,
        quantity: depotTransactions.quantity,
      })
      .from(depotTransactions),
    yesterday,
  );
  let stored = 0;
  const failures: string[] = [];
  for (const [isin, spansOfSecurity] of Map.groupBy(
    spans,
    ({ isin }) => isin,
  )) {
    try {
      for (const { from, to } of spansOfSecurity) {
        const [latest] = await db
          .select({ date: max(prices.date) })
          .from(prices)
          .where(and(eq(prices.isin, isin), between(prices.date, from, to)));
        const last = latest?.date;
        if (last && !weekdayAfter(last, to)) continue;
        const fetched = (
          await fetchPrices(
            isin,
            last ? shifted(last, 1) : shifted(from, -daysBeforeFirstPrice),
          )
        ).filter(({ date }) => date <= to);
        const firstMissing = fetched.findLastIndex(({ date }) => date <= from);
        const missing = fetched.slice(Math.max(firstMissing, 0));
        if (missing.length)
          stored += (
            await db
              .insert(prices)
              .values(missing.map((price) => ({ isin, ...price })))
              .onConflictDoNothing()
              .returning()
          ).length;
      }
    } catch (error) {
      failures.push(`${isin}: ${errorMessage(error)}`);
    }
  }
  if (failures.length)
    throw new ORPCError("BAD_GATEWAY", { message: failures.join("\n") });
  return { stored };
}
