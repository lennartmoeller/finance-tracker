const amountFormats: Record<string, Intl.NumberFormat> = {};
const moneyFormat = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});
const percentFormat = new Intl.NumberFormat("de-DE", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});
const quantityFormat = new Intl.NumberFormat("de-DE", {
  maximumFractionDigits: 10,
  signDisplay: "exceptZero",
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

const day = (date: string) => new Date(`${date}T00:00`);

export const formatAmount = (amount: string, currency: string) =>
  (amountFormats[currency] ??= new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
    signDisplay: "exceptZero",
  })).format(Number(amount));

export const formatMoney = (amount: string) =>
  moneyFormat.format(Number(amount));

export const formatPercent = (share: number) => percentFormat.format(share);

export const formatQuantity = (quantity: string) =>
  quantityFormat.format(Number(quantity));

export const formatDate = (date: string) => dateFormat.format(day(date));

export const formatMonth = (date: string) => monthFormat.format(day(date));
