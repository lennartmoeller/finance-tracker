import { currency } from "@finance-tracker/shared/contract";
import { z } from "zod";

const date = z.string().regex(/^\d{2}\.\d{2}\.\d{2}$/);
// finvesto drops trailing zeros of a number's decimals, and no number of 1,000 or more has been seen to show whether it groups thousands.
const germanNumber = z.string().regex(/^-?\d+(\.\d{3})*(,\d+)?$/);

export const headerV1 =
  "Depotnummer;Depotposition;Ref. Nr.;Buchungsdatum;Umsatzart;Teilumsatz;Fonds;ISIN;Zahlungsbetrag in ZW;Zahlungswährung (ZW);Anteile;Abrechnungskurs in FW;Fondswährung (FW);Kursdatum;Devisenkurs  (ZW/FW);Anlagebetrag in ZW;Vertriebsprovision in ZW (im Abrechnungskurs enthalten);KVG Einbehalt in ZW (im Abrechnungskurs enthalten);Gegenwert der Anteile in ZW;Anteile zum Bestandsdatum;Barausschüttung/Steuerliquidität je Anteil in EW;Ertragswährung (EW);Bestandsdatum;Devisenkurs (ZW/EW);Barausschüttung/Steuerliquidität in ZW;Bruttobetrag VAP je Anteil in EUR;Entgelt in ZW;Entgelt in EUR;Steuern in ZW;Steuern in EUR;Devisenkurs (EUR/ZW);Art des Steuereinbehalts;Steuereinbehalt in EUR";

// finvesto's CSV export holds only booked transactions, and its Ref. Nr. is the bank's unique reference of each.
export const depotV1 = z
  .tuple([
    z.string(),
    z.string(),
    z.string().regex(/^\d+\/\d+$/),
    date,
    z.enum([
      "Kauf",
      "Wiederanlage Fondsertrag",
      "Fondsertrag (Ausschüttung)",
      "Verkauf wegen Vorabpauschale",
      "Vorabpauschale",
      "Entgeltbelastung Verkauf",
      "Entgeltermittlung",
    ]),
    z.string(),
    z.string(),
    z.string(),
    germanNumber,
    currency,
    germanNumber,
    z.string(),
    z.string(),
    z.string(),
    z.string(),
    z.string(),
    z.string(),
    z.string(),
    z.string(),
    z.string(),
    z.string(),
    z.string(),
    z.string(),
    z.string(),
    z.string(),
    z.string(),
    z.string(),
    z.string(),
    z.string(),
    z.string(),
    germanNumber.or(z.literal("")),
    z.string(),
    z.string(),
  ])
  .refine((row) => row[9] === "EUR" || row[30] !== "", { path: [30] });

export type DepotV1 = z.infer<typeof depotV1>;
