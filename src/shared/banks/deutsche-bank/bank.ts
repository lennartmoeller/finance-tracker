import { depotNumber, iban } from "../../account-number.ts";
import type { Bank } from "../../bank.ts";

export default {
  name: "Deutsche Bank",
  logo: new URL("./logo.png", import.meta.url).href,
  accounts: { cash: iban, depot: depotNumber(12, [3, 7, 2]) },
} satisfies Bank;
