import type { Account } from "./contract.ts";

export const bankLogos: Record<Account["bank"], string> = {
  "Deutsche Bank": new URL("../assets/deutsche-bank.png", import.meta.url).href,
  finvesto: new URL("../assets/finvesto.png", import.meta.url).href,
  ING: new URL("../assets/ing.png", import.meta.url).href,
  "Trade Republic": new URL("../assets/trade-republic.png", import.meta.url)
    .href,
};
