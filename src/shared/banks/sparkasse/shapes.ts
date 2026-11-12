import { z } from "zod";
import { currency } from "../../contract.ts";

const date = z.string().regex(/^\d{2}\.\d{2}\.\d{2}$/);
const cell = z.string();

// Sparkasse's CSV-CAMT V8 export carries no transaction ID, and its Info cell tells booked transactions from pending ones, which may still change.
export const cashV1 = z.tuple([
  cell,
  date,
  date,
  cell,
  cell,
  cell,
  cell,
  cell,
  cell,
  cell,
  cell,
  cell,
  cell,
  cell,
  z.string().regex(/^-?\d+,\d{2}$/),
  currency,
  z.literal("Umsatz gebucht"),
]);
