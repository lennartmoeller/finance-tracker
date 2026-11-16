import { expect, test } from "vitest";
import { parseDepotJson } from "./adapter.ts";

const dividend = {
  type: "EARNING",
  subType: "DIVIDEND_DISBURSEMENT",
  bookDate: "2026-11-03",
  valueDate: "2026-11-03",
  createDate: "2026-11-03",
  paymentDate: "2026-11-03",
  securitiesAccountId: "100123456701",
  security: {
    wkn: "A2PKXG",
    isin: "IE00BK5BQT80",
    name: "All-World",
    tradeCurrency: "EUR",
  },
  quantity: "40.00000",
  settlementCharges: {
    germanWithholdingTax: { amount: "-2.64", currency: "EUR" },
  },
  calculatedAmounts: {
    netAmountEuroCurrency: { amount: "7.36", currency: "EUR" },
  },
  cashAccount: {
    id: "1001234567EUR",
    branchNumber: "100",
    accountNumber: "1234567",
    subAccountNumber: "00",
    currencyCode: "EUR",
  },
};
const depotJson = (transactions: object[]) =>
  JSON.stringify({ securitiesAccount: {}, transactions });

test("reads the depot's transactions with their keys in shape order and rejects one with an unknown field", () => {
  expect(JSON.stringify(parseDepotJson(depotJson([dividend])))).toBe(
    JSON.stringify([dividend]),
  );
  expect(() =>
    parseDepotJson(depotJson([{ ...dividend, fee: "1.00" }])),
  ).toThrow("doesn't match");
});
