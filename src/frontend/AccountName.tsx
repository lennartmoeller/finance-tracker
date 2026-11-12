import type { ReactNode } from "react";
import type { Account } from "@finance-tracker/shared/contract";
import { bankLogo } from "./banks.ts";

export function AccountName({
  account,
  children,
}: {
  account: Account;
  children?: ReactNode;
}) {
  const logo = bankLogo(account.bank);
  return (
    <span className="named">
      {logo && <img className="bank" src={logo} alt="" />}
      <span>
        {account.name}
        {children}
      </span>
    </span>
  );
}
