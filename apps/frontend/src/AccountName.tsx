import { bankLogos } from "@finance-tracker/shared/bank-logos";
import type { Account } from "@finance-tracker/shared/contract";

export function AccountName({
  account,
  children,
}: {
  account: Account;
  children?: React.ReactNode;
}) {
  return (
    <span className="named">
      <img className="bank" src={bankLogos[account.bank]} alt="" />
      <span>
        {account.name}
        {children}
      </span>
    </span>
  );
}
