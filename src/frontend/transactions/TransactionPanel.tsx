import type { ReactNode } from "react";
import { accountTypeNames } from "@finance-tracker/shared/account-type-names";
import type { Account } from "@finance-tracker/shared/contract";
import { AccountName } from "../AccountName.tsx";
import { formatDate } from "../format.ts";
import { Logo } from "../Logo.tsx";
import { none } from "../none.tsx";
import { Panel } from "../Panel.tsx";

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
    <Panel
      label="Transaction"
      head={
        <>
          <Logo src={logo} name={title} />
          <div className="panel-title">
            <div className="panel-name">{title ?? none}</div>
            <div className="panel-amount">{amount ?? none}</div>
          </div>
        </>
      }
      onClose={onClose}
    >
      <dl className="fields">
        {allFields.map(([name, value]) => (
          <div key={name}>
            <dt>{name}</dt>
            <dd>{value ?? none}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
