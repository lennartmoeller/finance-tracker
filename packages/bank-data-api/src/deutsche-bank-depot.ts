import { z } from "zod";
import { currency } from "./currency.ts";
import { decimal } from "./decimal.ts";

const date = z.iso.date();
const money = z.strictObject({ amount: decimal, currency });

// The web app's depot transactions carry no transaction ID, and fields such as the settling account or the order ID appear only on the types they apply to.
export const deutscheBankDepotRawTransactionV1 = z.strictObject({
  type: z.string(),
  subType: z.enum(["DIVIDEND_DISBURSEMENT", "RECEIPT"]),
  bookDate: date,
  valueDate: date,
  createDate: date,
  paymentDate: date.optional(),
  settlementDate: date.optional(),
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

export type DeutscheBankDepotRawTransactionV1 = z.infer<
  typeof deutscheBankDepotRawTransactionV1
>;
