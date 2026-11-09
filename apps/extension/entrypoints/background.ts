import { defineBackground } from "wxt/utils/define-background";
import { errorMessage } from "@finance-tracker/api/client";
import type { Account } from "@finance-tracker/api/contract";
import { apiClient } from "../api.ts";
import { readIngTransactions } from "../ing.ts";

export type SyncState =
  | { state: "running" }
  | { state: "done"; imported: number; skipped: number }
  | { state: "failed"; error: string };

export type SyncRequest = Pick<Account, "id" | "iban">;

export default defineBackground(() => {
  browser.runtime.onMessage.addListener(
    (message: SyncRequest | "keepalive") => {
      if (message !== "keepalive") void sync(message);
    },
  );
});

async function sync(account: SyncRequest) {
  const setState = (state: SyncState) =>
    browser.storage.session.set({ [account.id]: state });
  await setState({ state: "running" });
  try {
    const rawTransactions = await readIngTransactions(account.iban);
    const api = await apiClient();
    await setState({
      state: "done",
      ...(await api.sync({
        accountId: account.id,
        shapeVersion: 1,
        rawTransactions,
      })),
    });
  } catch (error) {
    await setState({ state: "failed", error: errorMessage(error) });
  }
}
