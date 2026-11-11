import { bankLogos } from "@finance-tracker/shared/bank-logos";
import type { Account } from "@finance-tracker/shared/contract";

export function BankLogo({
  bank,
  size,
}: {
  bank: Account["bank"];
  size: "small" | "medium";
}) {
  return <img className={`logo ${size}`} src={bankLogos[bank]} alt="" />;
}
