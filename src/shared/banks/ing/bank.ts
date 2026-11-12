import { iban } from "../../account-number.ts";
import type { Bank } from "../../bank.ts";

export default {
  name: "ING",
  logo: new URL("./logo.png", import.meta.url).href,
  accounts: { cash: iban },
} satisfies Bank;
