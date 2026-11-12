import type { CashTransaction } from "./contract.ts";
import { cents } from "./decimal.ts";

export const germanDecimal = (text: string) =>
  text.replaceAll(".", "").replace(",", ".");

export const germanDate = (text: string) =>
  text
    .split(".")
    .reverse()
    .map((part) => part.padStart(2, "0"))
    .join("-");

export const germanBooking = (booking: {
  date: string;
  amount: string;
  currency: string;
  counterparty: string;
  description: string;
}): CashTransaction => ({
  date: germanDate(booking.date),
  amount: cents(germanDecimal(booking.amount)),
  currency: booking.currency,
  counterparty: booking.counterparty || null,
  description: booking.description || null,
});
