import type { Bank, BankExportFile } from "@finance-tracker/shared/bank";
import type { Account } from "@finance-tracker/shared/contract";

export const banks = Object.values(
  import.meta.glob<Bank>("../shared/banks/*/bank.ts", {
    eager: true,
    import: "default",
  }),
);

export const bankLogo = (bank: string) =>
  banks.find(({ name }) => name === bank)?.logo;

const exportFiles = Object.values(
  import.meta.glob<BankExportFile>("../shared/banks/*/export-file.ts", {
    eager: true,
    import: "default",
  }),
);

export const exportFileOf = ({ bank, type }: Pick<Account, "bank" | "type">) =>
  exportFiles.find(({ name }) => name === bank)?.exportFiles[type];
