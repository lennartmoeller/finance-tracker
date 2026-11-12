import { z } from "zod";
import { currency } from "../../contract.ts";
import { decimal } from "../../decimal.ts";

export const cashHeaderV1 =
  "Buchungstag;Wert;Umsatzart;Begünstigter / Auftraggeber;Verwendungszweck;IBAN / Kontonummer;BIC;Kundenreferenz;Mandatsreferenz;Gläubiger ID;Fremde Gebühren;Betrag;Abweichender Empfänger;Anzahl der Aufträge;Anzahl der Schecks;Soll;Haben;Währung";

const cashDate = z.string().regex(/^\d{1,2}\.\d{1,2}\.\d{4}$/);
// Deutsche Bank drops trailing zeros of an amount's decimals, such as 750 or -100,8.
const cashAmount = z.string().regex(/^-?\d{1,3}(\.\d{3})*(,\d{1,2})?$/);
const cell = z.string();

// Deutsche Bank's CSV export holds only booked transactions, and its Kundenreferenz, often NOTPROVIDED, is no transaction ID.
export const cashV1 = z.tuple([
  cashDate,
  cashDate,
  cell,
  cell,
  cell,
  cell,
  cell,
  cell,
  cell,
  cell,
  cell,
  cashAmount,
  cell,
  cell,
  cell,
  cell,
  cell,
  currency,
]);

const depotDate = z.iso.date();
const money = z.strictObject({ amount: decimal, currency });

// The web app's depot transactions carry no transaction ID, and fields such as the settling account or the order ID appear only on the types they apply to.
export const depotV1 = z.strictObject({
  type: z.string(),
  subType: z.enum(["DIVIDEND_DISBURSEMENT", "RECEIPT"]),
  bookDate: depotDate,
  valueDate: depotDate,
  createDate: depotDate,
  paymentDate: depotDate.optional(),
  settlementDate: depotDate.optional(),
  securitiesAccountId: z.string(),
  security: z.strictObject({
    wkn: z.string(),
    isin: z.string(),
    name: z.string(),
    tradeCurrency: currency.optional(),
    quotationType: z.string().optional(),
    securityRate: money.optional(),
  }),
  quantity: decimal,
  settlementCharges: z.strictObject({
    germanWithholdingTax: money.optional(),
    foreignWithholdingTax: money.optional(),
    refundedWithholdingTax: money.optional(),
    ownExpenses: money.optional(),
    foreignExpenses: money.optional(),
  }),
  calculatedAmounts: z.strictObject({
    totalAmountEuroCurrency: money.optional(),
    totalAmountTradeCurrency: money.optional(),
    netAmountEuroCurrency: money.optional(),
    netAmountTradeCurrency: money.optional(),
    dividendTradeCurrency: money.optional(),
    accruedInterestEuroCurrency: money.optional(),
    accruedInterestTradeCurrency: money.optional(),
    costEuroCurrency: money.optional(),
  }),
  foreignExchangeRate: z
    .strictObject({
      rate: decimal,
      sourceCurrency: currency,
      targetCurrency: currency,
    })
    .optional(),
  cashAccount: z
    .strictObject({
      id: z.string(),
      branchNumber: z.string(),
      accountNumber: z.string(),
      subAccountNumber: z.string(),
      currencyCode: currency,
    })
    .optional(),
  orderId: z.string().optional(),
  interestRate: decimal.optional(),
  marketPlace: z.string().optional(),
});
