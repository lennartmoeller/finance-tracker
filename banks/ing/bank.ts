import { iban } from "@finance-tracker/shared/account-number";
import type { Bank } from "@finance-tracker/shared/bank";

export default {
  name: "ING",
  logo: new URL("./logo.png", import.meta.url).href,
  accounts: { cash: iban },
} satisfies Bank;
