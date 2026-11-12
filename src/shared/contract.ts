import { oc } from "@orpc/contract";
import { z } from "zod";
import { decimal } from "./decimal.ts";

export const accountType = z.enum(["cash", "depot"]);

export const currency = z.string().regex(/^[A-Z]{3}$/);

const account = z.object({
  id: z.int(),
  name: z
    .string()
    .trim()
    .min(1, "Name the account.")
    .max(40, "Use at most 40 characters."),
  bank: z.string(),
  type: accountType,
  number: z.string(),
  lastSyncedAt: z.date().nullable(),
  startBalance: decimal.nullable(),
});

export type Account = z.infer<typeof account>;

const syncInput = z.object({
  accountId: z.int(),
  shapeVersion: z.int().positive(),
  rawTransactions: z.array(z.unknown()),
});

export type SyncInput = z.infer<typeof syncInput>;

const cashTransaction = z.object({
  date: z.iso.date(),
  amount: decimal,
  currency,
  counterparty: z.string().nullable(),
  description: z.string().nullable(),
});

export type CashTransaction = z.infer<typeof cashTransaction>;

const depotTransaction = z.object({
  date: z.iso.date(),
  isin: z.string(),
  securityName: z.string(),
  securityLogo: z.string().nullable(),
  type: z.enum(["trade", "reinvestment", "fee", "tax", "distribution"]),
  quantity: decimal.nullable(),
  amount: decimal.nullable(),
  currency: currency.nullable(),
  description: z.string().nullable(),
});

export type DepotTransaction = z.infer<typeof depotTransaction>;

const transaction = z.object({
  id: z.int(),
  accountId: z.int(),
  cash: cashTransaction.nullable(),
  depot: depotTransaction.nullable(),
  brand: z.object({ name: z.string(), logo: z.string().nullable() }).nullable(),
});

export type Transaction = z.infer<typeof transaction>;

const price = z.object({
  isin: z.string(),
  date: z.iso.date(),
  price: decimal,
});

export type Price = z.infer<typeof price>;

export const contract = {
  account: {
    create: oc
      .input(account.pick({ name: true, bank: true, type: true, number: true }))
      .output(account),
    list: oc.output(z.array(account)),
    rename: oc.input(account.pick({ id: true, name: true })),
    remove: oc.input(account.pick({ id: true })),
  },
  sync: oc
    .input(syncInput)
    .output(z.object({ imported: z.int(), skipped: z.int() })),
  transaction: {
    list: oc.output(z.array(transaction)),
  },
  price: {
    fill: oc.output(z.object({ stored: z.int() })),
    list: oc.output(z.array(price)),
  },
};
