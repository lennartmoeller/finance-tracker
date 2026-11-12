import { expect, test } from "vitest";
import {
  accountNumberIssue,
  depotNumber,
  groupAccountNumber,
  iban,
} from "./account-number.ts";

test("a German IBAN with matching check digits and a depot number of its bank's length pass", () => {
  expect(
    accountNumberIssue("Muster Bank", iban, "DE89370400440532013000"),
  ).toBe(undefined);
  expect(
    accountNumberIssue(
      "Muster Bank",
      depotNumber(12, [3, 7, 2]),
      "100123456700",
    ),
  ).toBe(undefined);
});

test("a mistyped or foreign IBAN and a depot number of another length or with letters are named", () => {
  expect(
    accountNumberIssue("Muster Bank", iban, "DE89370400440532013001"),
  ).toBe("This IBAN's check digits don't match. Check it for a typo.");
  expect(
    accountNumberIssue("Muster Bank", iban, "GB82WEST12345698765432"),
  ).toBe("Only German IBANs, starting with DE, can be added.");
  expect(accountNumberIssue("Muster Bank", iban, "DE8937040044")).toBe(
    "An IBAN has 22 characters; this one has 12.",
  );
  const format = depotNumber(11, [4, 4, 3]);
  expect(accountNumberIssue("Muster Bank", format, "1234")).toBe(
    "A Muster Bank depot number has 11 digits; this one has 4.",
  );
  expect(accountNumberIssue("Muster Bank", format, "1234A")).toBe(
    "A depot number has digits only.",
  );
});

test("an account number groups as typed", () => {
  expect(groupAccountNumber("DE893704004405", iban.groups)).toBe(
    "DE89 3704 0044 05",
  );
});
