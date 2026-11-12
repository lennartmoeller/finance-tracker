import { defineBackground } from "wxt/utils/define-background";
import { errorMessage } from "@finance-tracker/shared/error-message";
import type { Account } from "@finance-tracker/shared/contract";
import { apiClient } from "../api.ts";
import { banks } from "../banks.ts";

export type SyncState =
  | { state: "running" }
  | { state: "done"; imported: number; skipped: number }
  | { state: "failed"; error: string };

export type SyncRequest = Pick<Account, "id" | "bank" | "type" | "number">;

// An adapter's injected script sends "keepalive" while it waits, because Firefox suspends the background after 30 seconds without events.
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
    const bank = banks.find(({ name }) => name === account.bank);
    if (!bank) throw new Error(`The extension reads no ${account.bank}.`);
    const read = await bank.read(account);
    await setState({
      state: "done",
      ...(await (await apiClient()).sync({ accountId: account.id, ...read })),
    });
  } catch (error) {
    await setState({ state: "failed", error: errorMessage(error) });
  }
}
