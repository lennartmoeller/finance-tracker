import { z } from "zod";
import { currency } from "./currency.ts";

const date = z.string().regex(/^\d{1,2}\.\d{1,2}\.\d{4}$/);
// Deutsche Bank drops trailing zeros of an amount's decimals, such as 750 or -100,8.
const amount = z.string().regex(/^-?\d{1,3}(\.\d{3})*(,\d{1,2})?$/);

export const deutscheBankGiroHeaderV1 =
  "Buchungstag;Wert;Umsatzart;Begünstigter / Auftraggeber;Verwendungszweck;IBAN / Kontonummer;BIC;Kundenreferenz;Mandatsreferenz;Gläubiger ID;Fremde Gebühren;Betrag;Abweichender Empfänger;Anzahl der Aufträge;Anzahl der Schecks;Soll;Haben;Währung";

// Deutsche Bank's CSV export holds only booked transactions, and its Kundenreferenz, often NOTPROVIDED, is no transaction ID.
export const deutscheBankGiroRawTransactionV1 = z.tuple([
  date,
  date,
  z.string(),
  z.string(),
  z.string(),
  z.string(),
  z.string(),
  z.string(),
  z.string(),
  z.string(),
  z.string(),
  amount,
  z.string(),
  z.string(),
  z.string(),
  z.string(),
  z.string(),
  currency,
]);

export type DeutscheBankGiroRawTransactionV1 = z.infer<
  typeof deutscheBankGiroRawTransactionV1
>;
