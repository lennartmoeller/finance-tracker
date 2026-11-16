import { z } from "zod";
import { ibanIn } from "./account-number.ts";
import type { CashTransaction } from "./contract.ts";
import { cents } from "./decimal.ts";

export const germanDateText = z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/);

export const germanAmountText = z.string().regex(/^-?\d{1,3}(\.\d{3})*,\d{2}$/);

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
  counterpartyIban?: string;
  description: string;
}): CashTransaction => ({
  date: germanDate(booking.date),
  amount: cents(germanDecimal(booking.amount)),
  currency: booking.currency,
  counterparty: booking.counterparty || null,
  counterpartyIban: ibanIn(booking.counterpartyIban ?? ""),
  description: booking.description || null,
});
