const german = (options: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat("de-DE", options);

const money = german({ style: "currency", currency: "EUR" });
const wholeMoney = german({
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const percent = {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
} as const;
const unsignedPercent = german(percent);
const wholePercent = german({ style: "percent" });
const signedQuantity = german({
  maximumFractionDigits: 10,
  signDisplay: "exceptZero",
});
const quantity = german({ maximumFractionDigits: 10 });
const moneyInput = german({
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const amounts = new Map<string, Intl.NumberFormat>();

const day = (date: string) => new Date(`${date}T00:00`);
const dateFormat = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const monthFormat = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
});
const shortMonthFormat = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "numeric",
});

export function formatAmount(amount: string, currency: string) {
  let format = amounts.get(currency);
  if (!format) {
    format = german({ style: "currency", currency, signDisplay: "exceptZero" });
    amounts.set(currency, format);
  }
  return format.format(Number(amount));
}

export const formatMoney = (amount: string) => money.format(Number(amount));

export const formatWholeMoney = (amount: number) => wholeMoney.format(amount);

export const formatUnsignedPercent = (share: number) =>
  unsignedPercent.format(share);

export const formatWholePercent = (share: number) => wholePercent.format(share);

export const formatQuantity = (value: string) =>
  signedQuantity.format(Number(value));

export const formatShares = (value: string) => quantity.format(Number(value));

export const formatCount = (count: number) => quantity.format(count);

export const formatDate = (date: string) => dateFormat.format(day(date));

export const formatMonth = (date: string) => monthFormat.format(day(date));

export const formatShortMonth = (date: string) =>
  shortMonthFormat.format(day(date));

export const formatMoneyInput = (amount: string) =>
  moneyInput.format(Number(amount));

export function parseMoneyInput(text: string): string | undefined {
  const [, sign, whole, cents = ""] =
    /^(-?)(\d{1,3}(?:\.?\d{3})*)(?:,(\d{1,2}))?$/.exec(text.trim()) ?? [];
  return whole === undefined
    ? undefined
    : `${sign ?? ""}${whole.replaceAll(".", "")}.${cents.padEnd(2, "0")}`;
}

export const capitalized = (term: string) =>
  term.charAt(0).toUpperCase() + term.slice(1);
