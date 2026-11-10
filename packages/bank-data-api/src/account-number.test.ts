import { expect, test } from "vitest";
import { newAccount } from "./contract.ts";

const issues = (account: { bank: string; type: string; number: string }) =>
  newAccount
    .safeParse({ name: "Cash account", ...account })
    .error?.issues.map((issue) => issue.message) ?? [];

test("accepts a German IBAN and a depot number of its bank's length", () => {
  expect(
    issues({ bank: "ING", type: "cash", number: "DE89370400440532013000" }),
  ).toEqual([]);
  expect(
    issues({ bank: "Deutsche Bank", type: "depot", number: "100123456700" }),
  ).toEqual([]);
});

test("rejects a mistyped or foreign IBAN, a short depot number and a type the bank lacks", () => {
  expect(
    issues({ bank: "ING", type: "cash", number: "DE89370400440532013001" }),
  ).toEqual(["This IBAN's check digits don't match. Check it for a typo."]);
  expect(
    issues({ bank: "ING", type: "cash", number: "GB82WEST12345698765432" }),
  ).toEqual(["Only German IBANs, starting with DE, can be added."]);
  expect(issues({ bank: "finvesto", type: "depot", number: "1234" })).toEqual([
    "A finvesto depot number has 11 digits; this one has 4.",
  ]);
  expect(
    issues({
      bank: "finvesto",
      type: "cash",
      number: "DE89370400440532013000",
    }),
  ).toEqual(["The extension syncs no cash account at finvesto."]);
});
