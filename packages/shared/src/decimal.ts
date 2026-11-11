import { z } from "zod";

export const decimal = z.string().regex(/^-?\d+(\.\d+)?$/);

const scaleOf = (value: string) => value.split(".")[1]?.length ?? 0;

const scaled = (value: string, scale: number) =>
  BigInt(value.replace(".", "") + "0".repeat(scale - scaleOf(value)));

const absolute = (value: bigint) => (value < 0n ? -value : value);

function unscaled(value: bigint, scale: number): string {
  const digits = absolute(value)
    .toString()
    .padStart(scale + 1, "0");
  const whole = digits.slice(0, digits.length - scale);
  return `${value < 0n ? "-" : ""}${whole}${scale ? `.${digits.slice(-scale)}` : ""}`;
}

export function decimalSum(values: string[]): string {
  const scale = Math.max(...values.map(scaleOf));
  return unscaled(
    values.reduce((sum, value) => sum + scaled(value, scale), 0n),
    scale,
  );
}

export function decimalProduct(factor: string, other: string): string {
  const [factorScale, otherScale] = [scaleOf(factor), scaleOf(other)];
  return unscaled(
    scaled(factor, factorScale) * scaled(other, otherScale),
    factorScale + otherScale,
  );
}

// Zeros beyond the cents go, but sub-cent digits stay, so the database's two-decimal check rejects them instead of a rounding hiding them.
export function cents(value: string): string {
  const [whole, fraction = ""] = value.split(".");
  return `${whole ?? ""}.${fraction.padEnd(2, "0").slice(0, 2)}${fraction.slice(2).replace(/0+$/, "")}`;
}

export function centsQuotient(dividend: string, divisor: string): string {
  const scale = Math.max(scaleOf(dividend), scaleOf(divisor));
  const numerator = scaled(dividend, scale) * 100n;
  const denominator = scaled(divisor, scale);
  const halfUp =
    (2n * absolute(numerator) + absolute(denominator)) /
    (2n * absolute(denominator));
  return unscaled(numerator < 0n !== denominator < 0n ? -halfUp : halfUp, 2);
}
