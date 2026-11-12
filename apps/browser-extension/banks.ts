import type { BankAdapter } from "@finance-tracker/shared/bank";

export const banks = Object.values(
  import.meta.glob<BankAdapter>("../../banks/*/adapter.ts", {
    eager: true,
    import: "default",
  }),
).sort((a, b) => a.name.localeCompare(b.name));
