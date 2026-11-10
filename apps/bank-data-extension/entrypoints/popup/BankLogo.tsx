import { bankLogos } from "@finance-tracker/bank-data-api/bank-logos";
import type { Account } from "@finance-tracker/bank-data-api/contract";

export function BankLogo({
  bank,
  size,
}: {
  bank: Account["bank"];
  size: "small" | "medium";
}) {
  return <img className={`logo ${size}`} src={bankLogos[bank]} alt="" />;
}
