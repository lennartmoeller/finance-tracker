export type AccountNumberFormat = {
  label: "IBAN" | "Depot number";
  length: number;
  groups: readonly number[];
};

export const iban: AccountNumberFormat = {
  label: "IBAN",
  length: 22,
  groups: [4, 4, 4, 4, 4, 2],
};

export const depotNumber = (
  length: number,
  groups: readonly number[],
): AccountNumberFormat => ({ label: "Depot number", length, groups });

export function accountNumberIssue(
  bank: string,
  { label, length }: AccountNumberFormat,
  number: string,
): string | undefined {
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
