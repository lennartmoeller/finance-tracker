import { expect, test } from "vitest";
import {
  formatMoneyInput,
  formatPlainAmount,
  formatPlainQuantity,
  parseMoneyInput,
} from "./format.ts";

test("an amount typed in German turns into cents, and one that isn't is refused", () => {
  expect(parseMoneyInput(formatMoneyInput("27571.35"))).toBe("27571.35");
  expect(parseMoneyInput("-12,5")).toBe("-12.50");
  expect(parseMoneyInput("1250")).toBe("1250.00");
  expect(parseMoneyInput("1.25")).toBeUndefined();
  expect(parseMoneyInput("12,345")).toBeUndefined();
});

test("an amount keeps its cents and a quantity loses its trailing zeros in the form filters match", () => {
  expect(formatPlainAmount("-1234.56")).toBe("-1234,56");
  expect(formatPlainAmount("-5.00")).toBe("-5,00");
  expect(formatPlainQuantity("2.5000")).toBe("2,5");
  expect(formatPlainQuantity("100")).toBe("100");
  expect(formatPlainQuantity("100.00")).toBe("100");
});
