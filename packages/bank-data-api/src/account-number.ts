import type { Account } from "./contract.ts";

type AccountNumberFormat = {
  label: "IBAN" | "Depot number";
  length: number;
  groups: readonly number[];
};

const iban: AccountNumberFormat = {
  label: "IBAN",
  length: 22,
  groups: [4, 4, 4, 4, 4, 2],
};

const depotNumber = (
  length: number,
  groups: readonly number[],
): AccountNumberFormat => ({ label: "Depot number", length, groups });

export const accountNumberFormats: Record<
  Account["bank"],
  Partial<Record<Account["type"], AccountNumberFormat>>
> = {
  "Deutsche Bank": { giro: iban, depot: depotNumber(12, [3, 7, 2]) },
  finvesto: { depot: depotNumber(11, [4, 4, 3]) },
  ING: { giro: iban, savings: iban },
  "Trade Republic": { cash: iban, depot: depotNumber(10, [4, 4, 2]) },
};

export function accountNumberIssue(
  bank: Account["bank"],
  format: AccountNumberFormat,
  number: string,
): string | undefined {
  if (format.label === "IBAN") {
    if (number.length !== format.length)
      return `An IBAN has ${format.length.toString()} characters; this one has ${number.length.toString()}.`;
    if (!/^DE\d{20}$/.test(number))
      return "Only German IBANs, starting with DE, can be added.";
    // ISO 13616 moves the country code and check digits to the end and reads D as 13 and E as 14.
    if (BigInt(`${number.slice(4)}1314${number.slice(2, 4)}`) % 97n !== 1n)
      return "This IBAN's check digits don't match. Check it for a typo.";
    return undefined;
  }
  if (!/^\d*$/.test(number)) return "A depot number has digits only.";
  if (number.length !== format.length)
    return `A ${bank} depot number has ${format.length.toString()} digits; this one has ${number.length.toString()}.`;
  return undefined;
}

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
