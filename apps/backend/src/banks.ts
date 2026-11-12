import { discover } from "@finance-tracker/banks/discover";
import type { BankExtraction } from "@finance-tracker/shared/bank";

export const banks = new Map(
  (await discover<BankExtraction>("extract.ts")).map((bank) => [
    bank.name,
    bank,
  ]),
);
