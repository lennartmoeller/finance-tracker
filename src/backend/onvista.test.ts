import { expect, test } from "vitest";
import { eodHistory } from "./onvista.ts";

const history = {
  isoCurrency: "EUR",
  datetimeLast: [1793966400, 1794225600, 1794312000],
  last: [129.4, 39.588171, 131.1],
};

test("an onvista history becomes one EUR close per trading day, as a decimal", () => {
  expect(eodHistory.parse(history)).toEqual([
    { date: "2026-11-06", price: "129.4" },
    { date: "2026-11-09", price: "39.588171" },
    { date: "2026-11-10", price: "131.1" },
  ]);
  expect(() => eodHistory.parse({ ...history, isoCurrency: "USD" })).toThrow();
  expect(() =>
    eodHistory.parse({ ...history, last: [129.4, 131.1] }),
  ).toThrow();
});
