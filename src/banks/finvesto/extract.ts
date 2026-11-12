import type { BankExtraction, Extracted } from "@finance-tracker/shared/bank";
import type { DepotTransaction } from "@finance-tracker/shared/contract";
import { centsQuotient } from "@finance-tracker/shared/decimal";
import { depotFields } from "@finance-tracker/shared/depot";
import { germanDate, germanDecimal } from "@finance-tracker/shared/german";
import { extraction } from "@finance-tracker/shared/raw-transactions";
import bank from "./bank.ts";
import { depotV1, type DepotV1 } from "./shapes.ts";

const notice = undefined;

const types: Record<DepotV1[4], DepotTransaction["type"] | typeof notice> = {
  Kauf: "trade",
  "Wiederanlage Fondsertrag": "reinvestment",
  "Fondsertrag (Ausschüttung)": "distribution",
  "Verkauf wegen Vorabpauschale": "tax",
  Vorabpauschale: notice,
  "Entgeltbelastung Verkauf": "fee",
  Entgeltermittlung: notice,
};

function extract(row: DepotV1): Extracted {
  const [identity, kind, part, payment] = [
    row[2],
    row[4],
    row[5],
    germanDecimal(row[8]),
  ];
  const type = types[kind];
  if (!type) return { identity };
  return {
    identity,
    depot: {
      date: `20${germanDate(row[3])}`,
      isin: row[7],
      securityName: row[6],
      ...depotFields(type, germanDecimal(row[10]), {
        // finvesto pays a distribution in its fund's currency and quotes column 30 as that currency per euro.
        amount:
          row[9] === "EUR"
            ? payment
            : centsQuotient(payment, germanDecimal(row[30])),
        currency: "EUR",
      }),
      description: part ? `${kind} · ${part}` : kind,
    },
  };
}

export default {
  ...bank,
  securityNameRank: 10,
  extractions: { depot: { 1: extraction(depotV1, extract) } },
} satisfies BankExtraction;
