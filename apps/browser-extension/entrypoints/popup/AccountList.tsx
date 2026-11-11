import { useState } from "react";
import { Check, CircleExclamationPoint, Pencil, RefreshCw } from "lucide-react";
import { bank } from "@finance-tracker/shared/bank";
import type { Account } from "@finance-tracker/shared/contract";
import { freshness, lastSyncText } from "@finance-tracker/shared/last-sync";
import type { SyncRequest, SyncState } from "../background.ts";
import { BankLogo } from "./BankLogo.tsx";
import { EditAccount } from "./EditAccount.tsx";

const count = new Intl.NumberFormat("en");

export function AccountList({
  accounts,
  syncs,
  justSynced,
  addedId,
  onChanged,
}: {
  accounts: Account[];
  syncs: Record<string, SyncState>;
  justSynced: ReadonlySet<string>;
  addedId: number | undefined;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState<Account>();
  return (
    <div className="overview">
      {bank.options.map((name) => {
        const group = accounts
          .filter((account) => account.bank === name)
          .sort((a, b) => a.name.localeCompare(b.name));
        return (
          group.length > 0 && (
            <section className="card" key={name}>
              <h2 className="group-head">
                <BankLogo bank={name} size="small" />
                {name}
              </h2>
              <ul className="accounts">
                {group.map((account) => (
                  <AccountRow
                    key={account.id}
                    account={account}
                    sync={syncs[account.id]}
                    justSynced={justSynced.has(String(account.id))}
                    added={account.id === addedId}
                    onEdit={() => {
                      setEditing(account);
                    }}
                  />
                ))}
              </ul>
            </section>
          )
        );
      })}
      {editing && (
        <EditAccount
          account={editing}
          accounts={accounts}
          onClose={() => {
            setEditing(undefined);
          }}
          onChanged={() => {
            setEditing(undefined);
            onChanged();
          }}
        />
      )}
    </div>
  );
}

function AccountRow({
  account,
  sync,
  justSynced,
  added,
  onEdit,
}: {
  account: Account;
  sync: SyncState | undefined;
  justSynced: boolean;
  added: boolean;
  onEdit: () => void;
}) {
  const running = sync?.state === "running";
  const result = justSynced && sync?.state === "done" ? sync : undefined;
  const request: SyncRequest = {
    id: account.id,
    bank: account.bank,
    type: account.type,
    number: account.number,
  };
  return (
    <li className={added ? "account added" : "account"}>
      <div className="account-text">
        <div className="account-name">{account.name}</div>
        <div className="status">
          <span
            className={`dot ${result ? "fresh" : freshness(account.lastSyncedAt)}`}
          />
          {running ? (
            <span>
              Syncing
              <span className="dots">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            </span>
          ) : result ? (
            <span>
              {result.imported ? (
                <span className="ok">{count.format(result.imported)} new</span>
              ) : (
                "Nothing new"
              )}{" "}
              · {count.format(result.skipped)} skipped
            </span>
          ) : (
            lastSyncText(account.lastSyncedAt)
          )}
        </div>
      </div>
      <div className="actions">
        <button
          className={`icon-button sync${running ? " running" : result ? " done" : ""}`}
          disabled={running}
          aria-label={`Sync ${account.name}`}
          title={running ? "Syncing…" : "Sync"}
          onClick={() => void browser.runtime.sendMessage(request)}
        >
          {result ? <Check /> : <RefreshCw />}
        </button>
        <button
          className="icon-button"
          disabled={running}
          aria-label={`Edit ${account.name}`}
          title="Edit"
          onClick={onEdit}
        >
          <Pencil />
        </button>
      </div>
      {sync?.state === "failed" && (
        <div className="note" role="alert">
          <CircleExclamationPoint />
          <span>{sync.error}</span>
        </div>
      )}
    </li>
  );
}
