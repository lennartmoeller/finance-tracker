import { z } from "zod";

export const decimal = z.string().regex(/^-?\d+(\.\d+)?$/);

const scaleOf = (value: string) => value.split(".")[1]?.length ?? 0;

const units = (value: string, scale: number) =>
  BigInt(value.replace(".", "") + "0".repeat(scale - scaleOf(value)));

const absolute = (value: bigint) => (value < 0n ? -value : value);

function fromUnits(value: bigint, scale: number): string {
  const digits = absolute(value)
    .toString()
    .padStart(scale + 1, "0");
  const point = digits.length - scale;
  return `${value < 0n ? "-" : ""}${digits.slice(0, point)}${scale ? `.${digits.slice(point)}` : ""}`;
}

export function decimalSum(values: string[]): string {
  const scale = Math.max(0, ...values.map(scaleOf));
  return fromUnits(
    values.reduce((sum, value) => sum + units(value, scale), 0n),
    scale,
  );
}

export function decimalProduct(factor: string, other: string): string {
  const [factorScale, otherScale] = [scaleOf(factor), scaleOf(other)];
  return fromUnits(
    units(factor, factorScale) * units(other, otherScale),
    factorScale + otherScale,
  );
}

export const negated = (value: string) =>
  value.startsWith("-") ? value.slice(1) : `-${value}`;

// Sub-cent digits stay, so the database's two-decimal check rejects them instead of a rounding hiding them.
export function cents(value: string): string {
  const [whole = "", fraction = ""] = value.split(".");
  return `${whole}.${fraction.padEnd(2, "0").slice(0, 2)}${fraction.slice(2).replace(/0+$/, "")}`;
}

export function centsQuotient(dividend: string, divisor: string): string {
  const scale = Math.max(scaleOf(dividend), scaleOf(divisor));
  const numerator = units(dividend, scale) * 100n;
  const denominator = units(divisor, scale);
  const halfUp =
    (2n * absolute(numerator) + absolute(denominator)) /
    (2n * absolute(denominator));
  return fromUnits(numerator < 0n !== denominator < 0n ? -halfUp : halfUp, 2);
}
