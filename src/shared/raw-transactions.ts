import type { z } from "zod";
import type { Extracted, Extraction } from "./bank.ts";

export const shapeMismatch = (bank: string) =>
  new Error(
    `The file doesn't match the ${bank} export the finance tracker reads.`,
  );

export const anotherAccount = (bank: string) =>
  new Error(`The ${bank} export is of another account.`);

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
