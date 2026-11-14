import { expect, test } from "vitest";
import { formatMoneyInput, parseMoneyInput } from "./format.ts";

test("an amount typed in German turns into cents, and one that isn't is refused", () => {
  expect(parseMoneyInput(formatMoneyInput("27571.35"))).toBe("27571.35");
  expect(parseMoneyInput("-12,5")).toBe("-12.50");
  expect(parseMoneyInput("1250")).toBe("1250.00");
  expect(parseMoneyInput("1.25")).toBeUndefined();
  expect(parseMoneyInput("12,345")).toBeUndefined();
});
