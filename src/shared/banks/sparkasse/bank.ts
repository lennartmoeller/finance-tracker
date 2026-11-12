import type { Bank } from "../../bank.ts";

export default {
  name: "Sparkasse",
  logo: new URL("./logo.png", import.meta.url).href,
  accounts: {},
} satisfies Bank;
