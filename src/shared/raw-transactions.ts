import type { z } from "zod";
import type { Extracted, Extraction } from "./bank.ts";

export const shapeMismatch = (bank: string) =>
  new Error(
    `${bank} changed the format of its transactions, so nothing was sent. The adapter needs a new shape version.`,
  );

export function parseRawTransactions<T>(
  bank: string,
  rawTransaction: z.ZodType<T>,
  rows: unknown[],
): T[] {
  const parsed = rawTransaction.array().safeParse(rows);
  if (!parsed.success) throw shapeMismatch(bank);
  return parsed.data;
}

export const extraction =
  <T>(
    rawTransaction: z.ZodType<T>,
    extract: (data: T) => Extracted,
  ): Extraction =>
  (rawTransactions) => {
    const parsed = rawTransaction.array().safeParse(rawTransactions);
    return parsed.success
      ? parsed.data.map((data) => ({ data, ...extract(data) }))
      : undefined;
  };
