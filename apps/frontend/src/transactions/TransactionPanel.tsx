import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { accountTypeNames } from "@finance-tracker/shared/account-type-names";
import type { Account } from "@finance-tracker/shared/contract";
import { AccountName } from "../AccountName.tsx";
import { formatDate } from "../format.ts";
import { Logo } from "../Logo.tsx";
import { none } from "../none.tsx";

export type Field = [name: string, value: ReactNode];

export function TransactionPanel({
  account,
  date,
  amount,
  logo,
  title,
  fields,
  onClose,
}: {
  account: Account;
  date: string;
  amount: string | null;
  logo: string | null;
  title: string | null;
  fields: Field[];
  onClose: () => void;
}) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    addEventListener("keydown", close);
    return () => {
      removeEventListener("keydown", close);
    };
  }, [onClose]);

  const allFields: Field[] = [
    ["Date", formatDate(date)],
    [
      "Account",
      <AccountName account={account}>
        <span className="account-meta">
          {account.bank} · {accountTypeNames[account.type]}
        </span>
      </AccountName>,
    ],
    ...fields,
  ];

  return (
    <aside className="panel" aria-label="Transaction">
      <div className="panel-head">
        <Logo src={logo} name={title} />
        <div className="panel-title">
          <div className="panel-name">{title ?? none}</div>
          <div className="panel-amount">{amount ?? none}</div>
        </div>
        <button className="icon-button" aria-label="Close" onClick={onClose}>
          <X />
        </button>
      </div>
      <dl className="fields">
        {allFields.map(([name, value]) => (
          <div key={name}>
            <dt>{name}</dt>
            <dd>{value ?? none}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
