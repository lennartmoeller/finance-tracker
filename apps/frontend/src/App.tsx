import { useEffect, useMemo, useState, type SubmitEvent } from "react";
import {
  createApiClient,
  errorMessage,
  isUnauthorized,
} from "@finance-tracker/api/client";
import { newAccount, type Account } from "@finance-tracker/api/contract";

const tokenKey = "apiToken";

export function App() {
  const [token, setToken] = useState(() => localStorage.getItem(tokenKey));

  function saveToken(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("token") as string;
    localStorage.setItem(tokenKey, value);
    setToken(value);
  }

  if (!token) {
    return (
      <form onSubmit={saveToken}>
        <label>
          API token <input name="token" type="password" required />
        </label>
        <button>Save</button>
      </form>
    );
  }
  return (
    <Accounts
      token={token}
      onUnauthorized={() => {
        localStorage.removeItem(tokenKey);
        setToken(null);
      }}
    />
  );
}

function Accounts({
  token,
  onUnauthorized,
}: {
  token: string;
  onUnauthorized: () => void;
}) {
  const api = useMemo(
    () => createApiClient(new URL("/rpc", location.href).href, token),
    [token],
  );
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState("");

  async function refresh(action?: () => Promise<unknown>) {
    try {
      await action?.();
      setAccounts(await api.account.list());
      setError("");
    } catch (failure) {
      if (isUnauthorized(failure)) onUnauthorized();
      else setError(errorMessage(failure));
    }
  }

  useEffect(() => {
    void refresh();
  }, [api]);

  function create(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = newAccount.safeParse({
      bank: form.get("bank"),
      type: form.get("type"),
      iban: (form.get("iban") as string).replaceAll(" ", "").toUpperCase(),
    });
    if (parsed.success) void refresh(() => api.account.create(parsed.data));
    else setError(parsed.error.issues.map((issue) => issue.message).join(", "));
  }

  return (
    <>
      <h1>Accounts</h1>
      <table>
        <thead>
          <tr>
            <th>Account</th>
            <th>IBAN</th>
            <th>Last sync</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr key={account.id}>
              <td>
                {account.bank} {account.type} account
              </td>
              <td>{account.iban.replace(/(.{4})/g, "$1 ")}</td>
              <td>{account.lastSyncedAt?.toLocaleString() ?? "never"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <form onSubmit={create}>
        <select name="bank">
          {newAccount.shape.bank.options.map((bank) => (
            <option key={bank}>{bank}</option>
          ))}
        </select>
        <select name="type">
          {newAccount.shape.type.options.map((type) => (
            <option key={type} value={type}>
              {type} account
            </option>
          ))}
        </select>
        <input name="iban" placeholder="IBAN" required />
        <button>Add account</button>
      </form>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
