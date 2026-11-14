import { useEffect, useMemo, useState } from "react";
import type { Rule, RuleInput } from "@finance-tracker/shared/contract";
import { App, type Api, type Data } from "../App.tsx";
import {
  deutscheBankShares,
  fakeData,
  matchTransactions,
} from "./fake-data.ts";
import "./mock.css";

const data = fakeData();

const dataStates = {
  normal: ["Normal", () => Promise.resolve(data)],
  loading: ["Loading", () => new Promise<Data>(() => undefined)],
  error: ["Error", () => Promise.reject(new Error("Can't reach the backend."))],
  noAccounts: [
    "No accounts",
    () =>
      Promise.resolve({ ...data, accounts: [], transactions: [], prices: [] }),
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
  noBrandsOrCategories: [
    "No brands or categories",
    () =>
      Promise.resolve(
        matchTransactions({ ...data, brands: [], categories: [] }),
      ),
  ],
  rejectedSave: ["Rejected save", () => Promise.resolve(data)],
} satisfies Record<string, [string, () => Promise<Data>]>;

const nextId = (items: { id: number }[]) =>
  Math.max(0, ...items.map(({ id }) => id)) + 1;

function fakeBackend(state: keyof typeof dataStates) {
  let stored: Promise<Data> | undefined;
  const load = () => (stored ??= dataStates[state][1]());
  const store = async (
    change: (data: Data) => Partial<Data>,
    refusal = "invalid regular expression: parentheses () not balanced",
  ) => {
    if (state === "rejectedSave") throw new Error(refusal);
    const data = await load();
    stored = Promise.resolve(matchTransactions({ ...data, ...change(data) }));
  };
  const identified = (data: Data, rules: RuleInput[]): Rule[] => {
    let next = nextId(
      [...data.brands, ...data.categories].flatMap(({ rules }) => rules),
    );
    return rules.map(({ id, ...rule }) => ({ ...rule, id: id ?? next++ }));
  };
  const accountRefusal = "This bank already has an account with this name.";
  const api: Api = {
    account: {
      list: async () => (await load()).accounts,
      create: async (input) => {
        const { accounts } = await load();
        const account = {
          ...input,
          id: nextId(accounts),
          lastSyncedAt: null,
          startBalance: null,
          closed: false,
        };
        await store(
          () => ({ accounts: [...accounts, account] }),
          accountRefusal,
        );
        return account;
      },
      update: ({ id, ...input }) =>
        store(
          ({ accounts }) => ({
            accounts: accounts.map((account) =>
              account.id === id ? { ...account, ...input } : account,
            ),
          }),
          accountRefusal,
        ),
      remove: ({ id }) =>
        store(
          ({ accounts, transactions }) => ({
            accounts: accounts.filter((account) => account.id !== id),
            transactions: transactions.filter(
              ({ accountId }) => accountId !== id,
            ),
          }),
          accountRefusal,
        ),
    },
    brand: {
      list: async () => (await load()).brands,
      create: (input) =>
        store((data) => ({
          brands: [
            ...data.brands,
            {
              ...input,
              id: nextId(data.brands),
              logo: null,
              rules: identified(data, input.rules),
            },
          ],
        })),
      update: ({ id, ...input }) =>
        store((data) => ({
          brands: data.brands.map((brand) =>
            brand.id === id
              ? { ...brand, ...input, rules: identified(data, input.rules) }
              : brand,
          ),
        })),
      remove: ({ id }) =>
        store(({ brands }) => ({
          brands: brands.filter((brand) => brand.id !== id),
        })),
    },
    category: {
      list: async () => (await load()).categories,
      create: (input) =>
        store((data) => ({
          categories: [
            ...data.categories,
            {
              ...input,
              id: nextId(data.categories),
              rules: identified(data, input.rules),
            },
          ],
        })),
      update: ({ id, ...input }) =>
        store((data) => ({
          categories: data.categories.map((category) =>
            category.id === id
              ? { ...category, ...input, rules: identified(data, input.rules) }
              : category,
          ),
        })),
      remove: ({ id }) =>
        store(({ categories }) => ({
          categories: categories.filter((category) => category.id !== id),
        })),
    },
  };
  return { load, api };
}

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
  const { load, api } = useMemo(() => fakeBackend(state), [state]);

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
      <App load={load} api={api} />
    </>
  );
}
