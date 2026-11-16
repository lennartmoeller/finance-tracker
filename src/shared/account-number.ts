import type { Account } from "./contract.ts";

export type GroupedAccountNumberFormat = {
  label: "IBAN" | "Depot number";
  length: number;
  groups: readonly number[];
};

export type AccountNumberFormat =
  GroupedAccountNumberFormat | { label: "Email" };

export const iban: GroupedAccountNumberFormat = {
  label: "IBAN",
  length: 22,
  groups: [4, 4, 4, 4, 4, 2],
};

export const depotNumber = (
  length: number,
  groups: readonly number[],
): GroupedAccountNumberFormat => ({ label: "Depot number", length, groups });

export const email: AccountNumberFormat = { label: "Email" };

export function accountNumberIssue(
  bank: string,
  format: AccountNumberFormat,
  number: string,
): string | undefined {
  if (format.label === "Email")
    return /^[^\s@]+@[^\s@]+$/.test(number)
      ? undefined
      : "An email address has one @ and no spaces.";
  const { label, length } = format;
  if (label === "IBAN") {
    if (number.length !== length)
      return `An IBAN has ${length.toString()} characters; this one has ${number.length.toString()}.`;
    if (!/^DE\d{20}$/.test(number))
      return "Only German IBANs, starting with DE, can be added.";
    // ISO 13616 moves the country code and check digits to the end and reads D as 13 and E as 14.
    if (BigInt(`${number.slice(4)}1314${number.slice(2, 4)}`) % 97n !== 1n)
      return "This IBAN's check digits don't match. Check it for a typo.";
    return undefined;
  }
  if (!/^\d*$/.test(number)) return "A depot number has digits only.";
  if (number.length !== length)
    return `A ${bank} depot number has ${length.toString()} digits; this one has ${number.length.toString()}.`;
  return undefined;
}

// Banks write an IBAN in groups or inside free text; an account of the user's has a German IBAN, so only those count.
export const ibanIn = (text: string) =>
  text
    .toUpperCase()
    .replace(/\s/g, "")
    .match(/DE\d{20}/)?.[0] ?? null;

export const takenAccountNumberIssue = (
  accounts: readonly Account[],
  bank: string,
  number: string,
) =>
  accounts.some((account) => account.bank === bank && account.number === number)
    ? `${bank} already has an account with this number.`
    : undefined;

export function groupAccountNumber(
  number: string,
  groups: readonly number[],
): string {
  const parts: string[] = [];
  let start = 0;
  for (const size of groups) {
    if (start >= number.length) break;
    parts.push(number.slice(start, start + size));
    start += size;
  }
  return parts.join(" ");
}
