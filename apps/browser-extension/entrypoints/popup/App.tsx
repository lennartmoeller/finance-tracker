import { useEffect, useState, type SubmitEvent } from "react";
import { CircleExclamationPoint, KeyRound, Landmark, Plus } from "lucide-react";
import { isUnauthorized } from "@finance-tracker/shared/client";
import { errorMessage } from "@finance-tracker/shared/error-message";
import type { Account } from "@finance-tracker/shared/contract";
import { apiClient, saveApiToken } from "../../api.ts";
import type { SyncState } from "../background.ts";
import { AccountList } from "./AccountList.tsx";
import { AddAccount } from "./AddAccount.tsx";

export function App() {
  const [accounts, setAccounts] = useState<Account[]>();
  const [syncs, setSyncs] = useState<Record<string, SyncState>>({});
  const [loadError, setLoadError] = useState("");
  const [needsToken, setNeedsToken] = useState(false);
  const [token, setToken] = useState("");
  const [adding, setAdding] = useState(false);
  const [addedId, setAddedId] = useState<number>();
  const toggleLabel = adding ? "Close" : "Add account";

  async function load() {
    try {
      setAccounts(await (await apiClient()).account.list());
      setLoadError("");
    } catch (error) {
      if (isUnauthorized(error)) setNeedsToken(true);
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

  async function saveToken(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveApiToken(token.trim());
    setNeedsToken(false);
    await load();
  }

  return (
    <>
      <header className="header">
        <div>
          <h1>Finance Tracker</h1>
          <p className="subtitle">
            {adding ? "Add account" : "Bank account sync"}
          </p>
        </div>
        {!needsToken && (
          <button
            className={
              adding ? "icon-button toggle open" : "icon-button toggle"
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
        )}
      </header>
      <main className="body">
        {needsToken ? (
          <form className="form" onSubmit={(event) => void saveToken(event)}>
            <div className="intro">
              <div className="intro-icon">
                <KeyRound />
              </div>
              <p className="intro-title">Connect to the backend</p>
            </div>
            <div className="field">
              <label className="label" htmlFor="token">
                API token
              </label>
              <input
                className="input"
                id="token"
                type="password"
                autoFocus
                value={token}
                onChange={(event) => {
                  setToken(event.target.value);
                }}
              />
            </div>
            <button className="button primary block" disabled={!token.trim()}>
              Save
            </button>
          </form>
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
