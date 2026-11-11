const amountFormats: Record<string, Intl.NumberFormat> = {};
const moneyFormat = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});
const wholeMoneyFormat = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const percentOptions = {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
} as const;
const percentFormat = new Intl.NumberFormat("de-DE", {
  ...percentOptions,
  signDisplay: "exceptZero",
});
const unsignedPercentFormat = new Intl.NumberFormat("de-DE", percentOptions);
const quantityFormat = new Intl.NumberFormat("de-DE", {
  maximumFractionDigits: 10,
  signDisplay: "exceptZero",
});
const sharesFormat = new Intl.NumberFormat("de-DE", {
  maximumFractionDigits: 10,
});
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

const day = (date: string) => new Date(`${date}T00:00`);

export const formatAmount = (amount: string, currency: string) =>
  (amountFormats[currency] ??= new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
    signDisplay: "exceptZero",
  })).format(Number(amount));

export const formatMoney = (amount: string) =>
  moneyFormat.format(Number(amount));

export const formatWholeMoney = (amount: number) =>
  wholeMoneyFormat.format(amount);

export const formatPercent = (share: number) => percentFormat.format(share);

export const formatUnsignedPercent = (share: number) =>
  unsignedPercentFormat.format(share);

export const formatQuantity = (quantity: string) =>
  quantityFormat.format(Number(quantity));

export const formatShares = (shares: string) =>
  sharesFormat.format(Number(shares));

export const formatDate = (date: string) => dateFormat.format(day(date));

export const formatMonth = (date: string) => monthFormat.format(day(date));

export const formatShortMonth = (date: string) =>
  shortMonthFormat.format(day(date));
