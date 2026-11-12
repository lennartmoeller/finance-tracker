import { useState } from "react";
import { Check, CircleExclamationPoint, Pencil, RefreshCw } from "lucide-react";
import type { Account } from "@finance-tracker/shared/contract";
import { freshness, lastSyncText } from "@finance-tracker/shared/last-sync";
import type { SyncRequest, SyncState } from "../background.ts";
import { BankLogo } from "./BankLogo.tsx";
import { EditAccount } from "./EditAccount.tsx";

const count = new Intl.NumberFormat("en");

export function AccountList({
  accounts,
  syncs,
  addedId,
  onChanged,
}: {
  accounts: Account[];
  syncs: Record<string, SyncState>;
  addedId: number | undefined;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState<Account>();
  const groups = Map.groupBy(
    accounts.toSorted(
      (a, b) => a.bank.localeCompare(b.bank) || a.name.localeCompare(b.name),
    ),
    (account) => account.bank,
  );
  return (
    <div className="overview">
      {Array.from(groups, ([bank, group]) => (
        <section className="card" key={bank}>
          <h2 className="group-head">
            <BankLogo bank={bank} size="small" />
            {bank}
          </h2>
          <ul className="accounts">
            {group.map((account) => (
              <AccountRow
                key={account.id}
                account={account}
                sync={syncs[account.id]}
                added={account.id === addedId}
                onEdit={() => {
                  setEditing(account);
                }}
              />
            ))}
          </ul>
        </section>
      ))}
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
  account: { id, name, bank, type, number, lastSyncedAt },
  sync,
  added,
  onEdit,
}: {
  account: Account;
  sync: SyncState | undefined;
  added: boolean;
  onEdit: () => void;
}) {
  const running = sync?.state === "running";
  const result = sync?.state === "done" ? sync : undefined;
  return (
    <li className={added ? "account added" : "account"}>
      <div className="account-text">
        <div className="account-name">{name}</div>
        <div className="status">
          <span
            className={`dot ${result ? "fresh" : freshness(lastSyncedAt)}`}
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
            lastSyncText(lastSyncedAt)
          )}
        </div>
      </div>
      <div className="actions">
        <button
          className={`icon-button sync${running ? " running" : result ? " done" : ""}`}
          disabled={running}
          aria-label={`Sync ${name}`}
          title={running ? "Syncing…" : "Sync"}
          onClick={() =>
            void browser.runtime.sendMessage({
              id,
              bank,
              type,
              number,
            } satisfies SyncRequest)
          }
        >
          {result ? <Check /> : <RefreshCw />}
        </button>
        <button
          className="icon-button"
          disabled={running}
          aria-label={`Edit ${name}`}
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
