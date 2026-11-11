import { z } from "zod";
import { currency } from "./currency.ts";

const date = z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/);
const amount = z.string().regex(/^-?\d{1,3}(\.\d{3})*,\d{2}$/);

export const ingHeaderV1 =
  "Buchung;Wertstellungsdatum;Auftraggeber/Empfänger;Buchungstext;Verwendungszweck;Referenz;Saldo;Währung;Betrag;Währung";

// ING's CSV export holds only booked transactions and carries no transaction ID.
export const ingRawTransactionV1 = z.tuple([
  date,
  date,
  z.string(),
  z.string(),
  z.string(),
  z.string(),
  amount,
  currency,
  amount,
  currency,
]);

export type IngRawTransactionV1 = z.infer<typeof ingRawTransactionV1>;
