import { z } from "zod";

export const decimal = z.string().regex(/^-?\d+(\.\d+)?$/);

export function decimalSum(values: string[]): string {
  const scaleOf = (value: string) => value.split(".")[1]?.length ?? 0;
  const scale = Math.max(...values.map(scaleOf));
  const total = values.reduce(
    (sum, value) =>
      sum + BigInt(value.replace(".", "") + "0".repeat(scale - scaleOf(value))),
    0n,
  );
  const digits = (total < 0n ? -total : total)
    .toString()
    .padStart(scale + 1, "0");
  const whole = digits.slice(0, digits.length - scale);
  return `${total < 0n ? "-" : ""}${whole}${scale ? `.${digits.slice(-scale)}` : ""}`;
}
