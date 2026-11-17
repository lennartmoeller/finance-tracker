import "./style.css";
import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { createApiClient } from "@finance-tracker/shared/client";
import { App } from "./App.tsx";

// A link loads another document unless intercepted, while history.replaceState and Back between the app's entries stay in this one; intercepting those too would reset focus out of a filter after each keystroke.
navigation.addEventListener("navigate", (event) => {
  if (event.canIntercept && !event.destination.sameDocument) event.intercept();
});

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
    const [accounts, transactions, prices, brands, categories, settings] =
      await Promise.all([
        api.account.list(),
        api.transaction.list(),
        api.price.list(),
        api.brand.list(),
        api.category.list(),
        api.settings.get(),
      ]);
    return { accounts, transactions, prices, brands, categories, settings };
  };
  render(<App load={load} api={api} />);
}
