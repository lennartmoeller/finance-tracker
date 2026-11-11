import { useCallback, useEffect, useState } from "react";
import { App, type Data } from "../App.tsx";
import { deutscheBankShares, fakeData } from "./fake-data.ts";
import "./mock.css";

const dataStates = {
  normal: "Normal",
  loading: "Loading",
  error: "Error",
  noAccounts: "No accounts",
  noTransactions: "No transactions",
  missingPrice: "Missing price",
};

const themes = { "light dark": "Auto", light: "Light", dark: "Dark" };

const data = fakeData();

function load(state: keyof typeof dataStates): Promise<Data> {
  switch (state) {
    case "normal":
      return Promise.resolve(data);
    case "loading":
      return new Promise(() => undefined);
    case "error":
      return Promise.reject(new Error("Can't reach the backend."));
    case "noAccounts":
      return Promise.resolve({ accounts: [], transactions: [], prices: [] });
    case "noTransactions":
      return Promise.resolve({ ...data, transactions: [] });
    case "missingPrice":
      return Promise.resolve({
        ...data,
        prices: data.prices.filter(({ isin }) => isin !== deutscheBankShares),
      });
  }
}

function Choice<Value extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Record<Value, string>;
  value: Value;
  onChange: (value: Value) => void;
}) {
  return (
    <>
      <span>{label}</span>
      <div className="mock-choice" role="group" aria-label={label}>
        {(Object.entries(options) as [Value, string][]).map(([key, name]) => (
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
  const loadState = useCallback(() => load(state), [state]);

  useEffect(() => {
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  return (
    <>
      <div className="mock-bar">
        <strong>Mock</strong>
        <Choice
          label="Data"
          options={dataStates}
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
      <App load={loadState} />
    </>
  );
}
