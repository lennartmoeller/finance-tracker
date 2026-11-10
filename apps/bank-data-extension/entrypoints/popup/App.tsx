import { useEffect, useState, type SubmitEvent } from "react";
import { CircleExclamationPoint, KeyRound, Landmark, Plus } from "lucide-react";
import {
  errorMessage,
  isUnauthorized,
} from "@finance-tracker/bank-data-api/client";
import type { Account } from "@finance-tracker/bank-data-api/contract";
import { apiClient, saveApiToken } from "../../api.ts";
import type { SyncState } from "../background.ts";
import { AccountList } from "./AccountList.tsx";
import { AddAccount } from "./AddAccount.tsx";

export function App() {
  const [accounts, setAccounts] = useState<Account[]>();
  const [syncs, setSyncs] = useState<Record<string, SyncState>>({});
  const [justSynced, setJustSynced] = useState<ReadonlySet<string>>(new Set());
  const [loadError, setLoadError] = useState("");
  const [needsToken, setNeedsToken] = useState(false);
  const [token, setToken] = useState("");
  const [adding, setAdding] = useState(false);
  const [addedId, setAddedId] = useState<number>();

  async function load() {
    try {
      setAccounts(await (await apiClient()).account.list());
      setLoadError("");
    } catch (failure) {
      if (isUnauthorized(failure)) setNeedsToken(true);
      else setLoadError(errorMessage(failure));
    }
  }

  useEffect(() => {
    void load();
    void browser.storage.session.get().then(setSyncs);
    const onChanged = (
      changes: Record<string, browser.storage.StorageChange>,
      area: string,
    ) => {
      if (area !== "session") return;
      for (const [id, change] of Object.entries(changes)) {
        const sync = change.newValue as SyncState;
        setSyncs((current) => ({ ...current, [id]: sync }));
        if (sync.state !== "done") continue;
        setJustSynced((current) => new Set(current).add(id));
        setTimeout(() => {
          setJustSynced((current) => {
            const next = new Set(current);
            next.delete(id);
            return next;
          });
        }, 10_000);
      }
      void load();
    };
    browser.storage.onChanged.addListener(onChanged);
    return () => {
      browser.storage.onChanged.removeListener(onChanged);
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
            aria-label={adding ? "Close" : "Add account"}
            title={adding ? "Close" : "Add account"}
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
                <button className="button small" onClick={() => void load()}>
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
                justSynced={justSynced}
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
