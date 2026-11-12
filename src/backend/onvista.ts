import { z } from "zod";
import type { Price } from "@finance-tracker/shared/contract";

const instruments = "https://api.onvista.de/api/v1/instruments";

const searchResult = z.object({
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

export const eodHistory = z
  .object({
    isoCurrency: z.literal("EUR"),
    datetimeLast: z.array(z.int()),
    last: z.array(z.number()),
  })
  .refine(
    ({ datetimeLast, last }) => datetimeLast.length === last.length,
    "onvista sent a different number of days and prices.",
  )
  .transform(({ datetimeLast, last }): Omit<Price, "isin">[] =>
    // onvista stamps each trading day at 12:00 UTC.
    datetimeLast.map((seconds, day) => ({
      date: new Date(seconds * 1000).toISOString().slice(0, 10),
      price: String(last[day]),
    })),
  );

async function get<T>(path: string, schema: z.ZodType<T>) {
  const response = await fetch(`${instruments}/${path}`, {
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok)
    throw new Error(`onvista answered ${response.status.toString()}.`);
  return schema.parse(await response.json());
}

export async function fetchPrices(isin: string, from: string) {
  const { list } = await get(`query?searchValue=${isin}`, searchResult);
  const instrument = list.find((hit) => hit.isin === isin);
  if (!instrument) throw new Error("onvista finds no security by this ISIN.");
  const path = `${instrument.entityType}/${instrument.entityValue}`;
  const { quoteList } = await get(`${path}/snapshot`, snapshot);
  const quote = quoteList.list.find(
    ({ market, isoCurrency }) =>
      market.codeMarket === "_LSX" && isoCurrency === "EUR",
  );
  if (!quote) throw new Error("onvista lists no EUR quote on LS Exchange.");
  // range=MAX reaches from startDate to the last finished trading day.
  return get(
    `${path}/eod_history?idNotation=${quote.market.idNotation.toString()}&range=MAX&startDate=${from}`,
    eodHistory,
  );
}
