import type { ReactNode } from "react";
import { accountTypeNames } from "@finance-tracker/shared/account-type-names";
import type { Account } from "@finance-tracker/shared/contract";
import { AccountName } from "../AccountName.tsx";
import { formatDate } from "../format.ts";
import { none } from "../none.tsx";
import { Panel } from "../Panel.tsx";

export type Field = [name: string, value: ReactNode];

export type PanelSide = { account: Account; date: string; fields: Field[] };

export function TransactionPanel({
  icon,
  title,
  amount,
  sides,
  onClose,
}: {
  icon: ReactNode;
  title: string | null;
  amount: string | null;
  sides: [transaction: PanelSide] | [from: PanelSide, to: PanelSide];
  onClose: () => void;
}) {
  const transfer = sides.length === 2;
  return (
    <Panel
      label={transfer ? "Transfer" : "Transaction"}
      head={
        <>
          {icon}
          <div className="panel-title">
            <div className="panel-name">{title ?? none}</div>
            <div className="panel-amount">{amount ?? none}</div>
          </div>
        </>
      }
      onClose={onClose}
    >
      {sides.map(({ account, date, fields }, index) => (
        <section key={index}>
          {transfer && <h3 className="panel-side">{index ? "To" : "From"}</h3>}
          <dl className="fields">
            {(
              [
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
              ] satisfies Field[]
            ).map(([name, value]) => (
              <div key={name}>
                <dt>{name}</dt>
                <dd>{value ?? none}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </Panel>
  );
}
