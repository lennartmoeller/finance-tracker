import { z } from "zod";
import { currency } from "../../contract.ts";

const date = z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/);
const amount = z.string().regex(/^-?\d{1,3}(\.\d{3})*,\d{2}$/);

export const headerV1 =
  "Buchung;Wertstellungsdatum;Auftraggeber/Empfänger;Buchungstext;Verwendungszweck;Referenz;Saldo;Währung;Betrag;Währung";

// ING's CSV export holds only booked transactions and carries no transaction ID.
export const cashV1 = z.tuple([
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

// ING's export before autumn 2026, without Referenz, which reached the system after version 1 through the legacy Finance application's data.
export const cashV2 = z.tuple([
  date,
  date,
  z.string(),
  z.string(),
  z.string(),
  amount,
  currency,
  amount,
  currency,
]);
