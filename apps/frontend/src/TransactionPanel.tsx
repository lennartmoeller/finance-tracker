import { X } from "lucide-react";
import { accountTypeNames } from "@finance-tracker/shared/account-type-names";
import type { Account } from "@finance-tracker/shared/contract";
import { AccountName } from "./AccountName.tsx";
import { formatDate } from "./format.ts";
import { Logo } from "./Logo.tsx";
import { none } from "./none.tsx";

export type Details = {
  logo: string | null;
  title: string | null;
  amount: string | null;
  date: string;
  fields: [string, React.ReactNode][];
};

export function TransactionPanel({
  account,
  details: { logo, title, amount, date, fields },
  onClose,
}: {
  account: Account;
  details: Details;
  onClose: () => void;
}) {
  return (
    <aside className="panel" aria-label="Transaction">
      <div className="panel-head">
        <Logo src={logo} name={title} large />
        <div className="panel-title">
          <div className="panel-name">{title ?? none}</div>
          <div className="panel-amount">{amount ?? none}</div>
        </div>
        <button className="icon-button" aria-label="Close" onClick={onClose}>
          <X />
        </button>
      </div>
      <dl className="fields">
        {[
          ["Date", formatDate(date)] as const,
          [
            "Account",
            <AccountName account={account}>
              <span className="account-meta">
                {account.bank} · {accountTypeNames[account.type]}
              </span>
            </AccountName>,
          ] as const,
          ...fields,
        ].map(([name, value]) => (
          <div key={name}>
            <dt>{name}</dt>
            <dd>{value ?? none}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
