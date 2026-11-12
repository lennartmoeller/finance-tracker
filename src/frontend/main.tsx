import "./style.css";
import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { createApiClient } from "@finance-tracker/shared/client";
import { App } from "./App.tsx";

const root = createRoot(document.getElementById("root") as HTMLElement);
const render = (app: ReactNode) => {
  root.render(<StrictMode>{app}</StrictMode>);
};

if (import.meta.env.MODE === "mock")
  void import("./mock/Mock.tsx").then(({ Mock }) => {
    render(<Mock />);
  });
else {
  const api = createApiClient(`${location.origin}/rpc`);
  const load = async () => {
    const [accounts, transactions, prices] = await Promise.all([
      api.account.list(),
      api.transaction.list(),
      api.price.list(),
    ]);
    return { accounts, transactions, prices };
  };
  render(<App load={load} />);
}
