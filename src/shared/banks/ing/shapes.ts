import { z } from "zod";
import { currency } from "../../contract.ts";
import { germanAmountText, germanDateText } from "../../german.ts";

export const headerV1 =
  "Buchung;Wertstellungsdatum;Auftraggeber/Empfänger;Buchungstext;Verwendungszweck;Referenz;Saldo;Währung;Betrag;Währung";

// ING's CSV export holds only booked transactions and carries no transaction ID.
export const cashV1 = z.tuple([
  germanDateText,
  germanDateText,
  z.string(),
  z.string(),
  z.string(),
  z.string(),
  germanAmountText,
  currency,
  germanAmountText,
  currency,
]);

// ING's export before autumn 2026, without Referenz, which reached the system after version 1 through the legacy Finance application's data.
export const cashV2 = z.tuple([
  germanDateText,
  germanDateText,
  z.string(),
  z.string(),
  z.string(),
  germanAmountText,
  currency,
  germanAmountText,
  currency,
]);
