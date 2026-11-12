import { useEffect, useState } from "react";
import { CircleExclamationPoint, Landmark, Plus, Settings } from "lucide-react";
import { syncedBy } from "@finance-tracker/shared/bank";
import { isUnauthorized, isUnreachable } from "@finance-tracker/shared/client";
import { errorMessage } from "@finance-tracker/shared/error-message";
import type { Account } from "@finance-tracker/shared/contract";
import { apiClient } from "../../api.ts";
import { banks } from "../../banks.ts";
import type { SyncState } from "../background.ts";
import { AccountList } from "./AccountList.tsx";
import { AddAccount } from "./AddAccount.tsx";
import { Connect, type ConnectErrors } from "./Connect.tsx";

export function App() {
  const [accounts, setAccounts] = useState<Account[]>();
  const [syncs, setSyncs] = useState<Record<string, SyncState>>({});
  const [loadError, setLoadError] = useState("");
  const [connectErrors, setConnectErrors] = useState<ConnectErrors>();
  const [adding, setAdding] = useState(false);
  const [addedId, setAddedId] = useState<number>();
  const toggleLabel = adding ? "Close" : "Add account";

  async function load() {
    try {
      setAccounts(
        (await (await apiClient()).account.list()).filter((account) =>
          syncedBy(banks, account),
        ),
      );
      setLoadError("");
    } catch (error) {
      if (isUnauthorized(error))
        setConnectErrors({ apiToken: errorMessage(error) });
      else if (isUnreachable(error))
        setConnectErrors({ address: errorMessage(error) });
      else setLoadError(errorMessage(error));
    }
  }

  useEffect(() => {
    void load();
    // A sync's result shows only for 10 seconds after it arrives in the open popup.
    void browser.storage.session
      .get()
      .then((stored: Record<string, SyncState>) => {
        setSyncs(
          Object.fromEntries(
            Object.entries(stored).filter(([, sync]) => sync.state !== "done"),
          ),
        );
      });
    const onChanged = (
      changes: Record<string, browser.storage.StorageChange>,
    ) => {
      for (const [id, change] of Object.entries(changes)) {
        const sync = change.newValue as SyncState;
        setSyncs((current) => ({ ...current, [id]: sync }));
        if (sync.state === "done")
          setTimeout(() => {
            setSyncs((current) =>
              Object.fromEntries(
                Object.entries(current).filter(([, shown]) => shown !== sync),
              ),
            );
          }, 10_000);
      }
      void load();
    };
    browser.storage.session.onChanged.addListener(onChanged);
    return () => {
      browser.storage.session.onChanged.removeListener(onChanged);
    };
  }, []);

  return (
    <>
      <header className="header">
        <div>
          <h1>Finance Tracker</h1>
          <p className="subtitle">
            {adding ? "Add account" : "Bank account sync"}
          </p>
        </div>
        {!connectErrors && (
          <div className="header-actions">
            <button
              className="icon-button header-button"
              title="Connection"
              onClick={() => {
                setConnectErrors({});
                setAdding(false);
              }}
            >
              <Settings />
            </button>
            <button
              className={
                adding
                  ? "icon-button header-button open"
                  : "icon-button header-button"
              }
              disabled={!accounts}
              title={toggleLabel}
              onClick={() => {
                setAdding(!adding);
                setAddedId(undefined);
              }}
            >
              <Plus />
            </button>
          </div>
        )}
      </header>
      <main className="body">
        {connectErrors ? (
          <Connect
            errors={connectErrors}
            onConnected={() => {
              setConnectErrors(undefined);
              void load();
            }}
          />
        ) : adding && accounts ? (
          <AddAccount
            accounts={accounts}
            onAdded={(account) => {
              setAdding(false);
              setAddedId(account.id);
              void load();
            }}
          />
        ) : (
          <>
            {loadError && (
              <div className="banner" role="alert">
                <CircleExclamationPoint />
                <strong>{loadError}</strong>
                <button className="button retry" onClick={() => void load()}>
                  Retry
                </button>
              </div>
            )}
            {accounts?.length === 0 && (
              <div className="intro">
                <div className="intro-icon">
                  <Landmark />
                </div>
                <p className="intro-title">No accounts yet</p>
                <p className="intro-text">
                  Add an account to sync its transactions from your bank's
                  website.
                </p>
                <button
                  className="button primary"
                  onClick={() => {
                    setAdding(true);
                  }}
                >
                  <Plus />
                  Add account
                </button>
              </div>
            )}
            {accounts && accounts.length > 0 && (
              <AccountList
                accounts={accounts}
                syncs={syncs}
                addedId={addedId}
                onChanged={() => void load()}
              />
            )}
          </>
        )}
      </main>
    </>
  );
}
