import { useCallback, useEffect, useState } from "react";
import { App, type Data } from "../App.tsx";
import { deutscheBankShares, fakeData } from "./fake-data.ts";
import "./mock.css";

const data = fakeData();

const dataStates = {
  normal: ["Normal", () => Promise.resolve(data)],
  loading: ["Loading", () => new Promise(() => undefined)],
  error: ["Error", () => Promise.reject(new Error("Can't reach the backend."))],
  noAccounts: [
    "No accounts",
    () => Promise.resolve({ accounts: [], transactions: [], prices: [] }),
  ],
  noTransactions: [
    "No transactions",
    () => Promise.resolve({ ...data, transactions: [] }),
  ],
  missingPrice: [
    "Missing price",
    () =>
      Promise.resolve({
        ...data,
        prices: data.prices.filter(({ isin }) => isin !== deutscheBankShares),
      }),
  ],
} satisfies Record<string, [string, () => Promise<Data>]>;

const themes = { "light dark": "Auto", light: "Light", dark: "Dark" };

function Choice<Key extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Record<Key, string>;
  value: Key;
  onChange: (value: Key) => void;
}) {
  return (
    <>
      <span>{label}</span>
      <div className="mock-choice" role="group" aria-label={label}>
        {(Object.entries(options) as [Key, string][]).map(([key, name]) => (
          <button
            key={key}
            aria-pressed={key === value}
            onClick={() => {
              onChange(key);
            }}
          >
            {name}
          </button>
        ))}
      </div>
    </>
  );
}

export function Mock() {
  const [state, setState] = useState<keyof typeof dataStates>("normal");
  const [theme, setTheme] = useState<keyof typeof themes>("light dark");
  const load = useCallback(() => dataStates[state][1](), [state]);

  useEffect(() => {
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  return (
    <>
      <div className="mock-bar">
        <strong>Mock</strong>
        <Choice
          label="Data"
          options={
            Object.fromEntries(
              Object.entries(dataStates).map(([key, [name]]) => [key, name]),
            ) as Record<keyof typeof dataStates, string>
          }
          value={state}
          onChange={setState}
        />
        <Choice
          label="Theme"
          options={themes}
          value={theme}
          onChange={setTheme}
        />
      </div>
      <App load={load} />
    </>
  );
}
