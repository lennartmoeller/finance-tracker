import { z } from "zod";
import type { Price } from "@finance-tracker/shared/contract";

const instruments = "https://api.onvista.de/api/v1/instruments";
const lsExchange = "_LSX";
const timeout = 5000;

const search = z.object({
  list: z.array(
    z.object({
      isin: z.string(),
      entityType: z.string(),
      entityValue: z.string(),
    }),
  ),
});

const snapshot = z.object({
  quoteList: z.object({
    list: z.array(
      z.object({
        market: z.object({ codeMarket: z.string(), idNotation: z.int() }),
        isoCurrency: z.string(),
      }),
    ),
  }),
});

const history = z
  .object({
    isoCurrency: z.literal("EUR"),
    datetimeLast: z.array(z.int()),
    last: z.array(z.number()),
  })
  .refine(
    ({ datetimeLast, last }) => datetimeLast.length === last.length,
    "onvista sent a different number of days and prices.",
  );

async function get(path: string): Promise<unknown> {
  const response = await fetch(`${instruments}/${path}`, {
    signal: AbortSignal.timeout(timeout),
  });
  if (!response.ok)
    throw new Error(`onvista answered ${response.status.toString()}.`);
  return response.json();
}

export function parsePrices(body: unknown): Omit<Price, "isin">[] {
  const { datetimeLast, last } = history.parse(body);
  // onvista stamps each trading day at 12:00 UTC.
  return datetimeLast.map((seconds, index) => ({
    date: new Date(seconds * 1000).toISOString().slice(0, 10),
    price: String(last[index]),
  }));
}

export async function fetchPrices(isin: string, from: string) {
  const instrument = search
    .parse(await get(`query?searchValue=${isin}`))
    .list.find((hit) => hit.isin === isin);
  if (!instrument) throw new Error("onvista finds no security by this ISIN.");
  const path = `${instrument.entityType}/${instrument.entityValue}`;
  const quote = snapshot
    .parse(await get(`${path}/snapshot`))
    .quoteList.list.find(
      ({ market, isoCurrency }) =>
        market.codeMarket === lsExchange && isoCurrency === "EUR",
    );
  if (!quote) throw new Error("onvista lists no EUR quote on LS Exchange.");
  // range=MAX reaches from startDate to the last finished trading day.
  return parsePrices(
    await get(
      `${path}/eod_history?idNotation=${quote.market.idNotation.toString()}&range=MAX&startDate=${from}`,
    ),
  );
}
