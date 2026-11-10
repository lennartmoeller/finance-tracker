import { defineBackground } from "wxt/utils/define-background";
import { errorMessage } from "@finance-tracker/bank-data-api/client";
import type { Account } from "@finance-tracker/bank-data-api/contract";
import { apiClient } from "../api.ts";
import { readDeutscheBankTransactions } from "../deutsche-bank.ts";
import { readIngTransactions } from "../ing.ts";
import { readTradeRepublicTransactions } from "../trade-republic.ts";

export type SyncState =
  | { state: "running" }
  | { state: "done"; imported: number; skipped: number }
  | { state: "failed"; error: string };

export type SyncRequest = Pick<Account, "id" | "bank" | "type" | "number">;

const readers = {
  ING: readIngTransactions,
  "Trade Republic": readTradeRepublicTransactions,
  "Deutsche Bank": readDeutscheBankTransactions,
};

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
    const read = await readers[account.bank](account);
    const api = await apiClient();
    await setState({
      state: "done",
      ...(await api.sync({ accountId: account.id, ...read })),
    });
  } catch (error) {
    await setState({ state: "failed", error: errorMessage(error) });
  }
}
