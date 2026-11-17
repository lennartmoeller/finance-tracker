import { expect, test } from "vitest";
import {
  formatDate,
  formatMoneyInput,
  formatPlainAmount,
  formatPlainQuantity,
  parseDateInput,
  parseMoneyInput,
} from "./format.ts";

test("an amount typed in German turns into cents, and one that isn't is refused", () => {
  expect(parseMoneyInput(formatMoneyInput("27571.35"))).toBe("27571.35");
  expect(parseMoneyInput("-12,5")).toBe("-12.50");
  expect(parseMoneyInput("1250")).toBe("1250.00");
  expect(parseMoneyInput("1.25")).toBeUndefined();
  expect(parseMoneyInput("12,345")).toBeUndefined();
});

test("a date typed in German turns into its ISO day, and one that isn't a day is refused", () => {
  expect(parseDateInput(formatDate("2024-01-01"))).toBe("2024-01-01");
  expect(parseDateInput("1.3.2024")).toBe("2024-03-01");
  expect(parseDateInput("30.02.2024")).toBeUndefined();
  expect(parseDateInput("2024-01-01")).toBeUndefined();
});

test("an amount keeps its cents and a quantity loses its trailing zeros in the form filters match", () => {
  expect(formatPlainAmount("-1234.56")).toBe("-1234,56");
  expect(formatPlainAmount("-5.00")).toBe("-5,00");
  expect(formatPlainQuantity("2.5000")).toBe("2,5");
  expect(formatPlainQuantity("100")).toBe("100");
  expect(formatPlainQuantity("100.00")).toBe("100");
});
