import type { Bank } from "@finance-tracker/shared/bank";

const logos = new Map(
  Object.values(
    import.meta.glob<Bank>("../shared/banks/*/bank.ts", {
      eager: true,
      import: "default",
    }),
  ).map(({ name, logo }) => [name, logo]),
);

export const bankLogo = (bank: string) => logos.get(bank);
