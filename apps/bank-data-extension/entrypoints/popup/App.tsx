import { useEffect, useState, type SubmitEvent } from "react";
import {
  errorMessage,
  isUnauthorized,
} from "@finance-tracker/bank-data-api/client";
import {
  newAccount,
  type Account,
} from "@finance-tracker/bank-data-api/contract";
import { apiClient, saveApiToken } from "../../api.ts";
import type { SyncRequest, SyncState } from "../background.ts";

const relativeTime = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function typeName(type: Account["type"]): string {
  return type === "depot" ? "depot" : `${type} account`;
}

function ago(date: Date): string {
  const seconds = (date.getTime() - Date.now()) / 1000;
  for (const [unit, size] of [
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ] as const) {
    if (Math.abs(seconds) >= size)
      return relativeTime.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

export function App() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [syncs, setSyncs] = useState<Record<string, SyncState>>({});
  const [error, setError] = useState("");
  const [needsToken, setNeedsToken] = useState(false);

  async function load(action?: () => Promise<unknown>) {
    try {
      await action?.();
      setAccounts(await (await apiClient()).account.list());
      setError("");
    } catch (failure) {
      if (isUnauthorized(failure)) setNeedsToken(true);
      else setError(errorMessage(failure));
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
      setSyncs((current) => ({
        ...current,
        ...Object.fromEntries(
          Object.entries(changes).map(([id, change]) => [
            id,
            change.newValue as SyncState,
          ]),
        ),
      }));
      void load();
    };
    browser.storage.onChanged.addListener(onChanged);
    return () => {
      browser.storage.onChanged.removeListener(onChanged);
    };
  }, []);

  async function saveToken(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveApiToken(
      new FormData(event.currentTarget).get("token") as string,
    );
    setNeedsToken(false);
    await load();
  }

  function create(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = newAccount.safeParse({
      bank: form.get("bank"),
      type: form.get("type"),
      number: (form.get("number") as string).replaceAll(" ", "").toUpperCase(),
    });
    if (parsed.success)
      void load(async () => (await apiClient()).account.create(parsed.data));
    else setError(parsed.error.issues.map((issue) => issue.message).join(", "));
  }

  if (needsToken) {
    return (
      <form onSubmit={(event) => void saveToken(event)}>
        <label>
          API token <input name="token" type="password" required />
        </label>
        <button>Save</button>
      </form>
    );
  }
  return (
    <>
      <ul>
        {accounts.map((account) => {
          const sync = syncs[account.id];
          const request: SyncRequest = {
            id: account.id,
            bank: account.bank,
            type: account.type,
            number: account.number,
          };
          return (
            <li key={account.id}>
              <strong>
                {account.bank} {typeName(account.type)}
              </strong>
              <button
                disabled={sync?.state === "running"}
                onClick={() => void browser.runtime.sendMessage(request)}
              >
                {sync?.state === "running" ? "Syncing…" : "Sync"}
              </button>
              <p>{account.number.replace(/(.{4})/g, "$1 ")}</p>
              <p>
                {account.lastSyncedAt
                  ? `Synced ${ago(account.lastSyncedAt)}`
                  : "Never synced"}
              </p>
              {sync?.state === "done" && (
                <p>
                  {sync.imported} imported, {sync.skipped} skipped
                </p>
              )}
              {sync?.state === "failed" && <p role="alert">{sync.error}</p>}
            </li>
          );
        })}
      </ul>
      <form onSubmit={create}>
        <select name="bank">
          {newAccount.shape.bank.options.map((bank) => (
            <option key={bank}>{bank}</option>
          ))}
        </select>
        <select name="type">
          {newAccount.shape.type.options.map((type) => (
            <option key={type} value={type}>
              {typeName(type)}
            </option>
          ))}
        </select>
        <input name="number" placeholder="Account number" required />
        <button>Add account</button>
      </form>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
