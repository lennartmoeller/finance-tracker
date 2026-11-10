import { z } from "zod";
import { currency } from "./currency.ts";
import { decimal } from "./decimal.ts";

export const tradeRepublicRawTransactionV1 = z.strictObject({
  datetime: z.iso.datetime(),
  date: z.iso.date(),
  account_type: z.string(),
  category: z.string(),
  type: z.string(),
  asset_class: z.string(),
  name: z.string(),
  symbol: z.string(),
  shares: z.string(),
  price: z.string(),
  amount: decimal,
  fee: z.string(),
  tax: z.string(),
  currency,
  original_amount: z.string(),
  original_currency: z.string(),
  fx_rate: z.string(),
  description: z.string(),
  transaction_id: z.uuid(),
  counterparty_name: z.string(),
  counterparty_iban: z.string(),
  payment_reference: z.string(),
  mcc_code: z.string(),
});

export type TradeRepublicRawTransactionV1 = z.infer<
  typeof tradeRepublicRawTransactionV1
>;
