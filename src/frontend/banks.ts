import type { Bank } from "@finance-tracker/shared/bank";

export const banks = Object.values(
  import.meta.glob<Bank>("../shared/banks/*/bank.ts", {
    eager: true,
    import: "default",
  }),
);

export const bankLogo = (bank: string) =>
  banks.find(({ name }) => name === bank)?.logo;
