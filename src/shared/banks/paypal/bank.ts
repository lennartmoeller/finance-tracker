import { email } from "../../account-number.ts";
import type { Bank } from "../../bank.ts";

export default {
  name: "PayPal",
  logo: new URL("./logo.png", import.meta.url).href,
  accounts: { cash: email },
} satisfies Bank;
