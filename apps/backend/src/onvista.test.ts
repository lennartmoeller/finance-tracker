import { expect, test } from "vitest";
import { parsePrices } from "./onvista.ts";

const history = {
  isoCurrency: "EUR",
  datetimeLast: [1793966400, 1794225600, 1794312000],
  first: [129.9, 129.0, 129.5],
  last: [129.4, 39.588171, 131.1],
};

test("an onvista history becomes one price per trading day, its close as a decimal", () => {
  expect(parsePrices(history)).toEqual([
    { date: "2026-11-06", price: "129.4" },
    { date: "2026-11-09", price: "39.588171" },
    { date: "2026-11-10", price: "131.1" },
  ]);
});

test("an onvista history in another currency or with a price missing is rejected", () => {
  expect(() => parsePrices({ ...history, isoCurrency: "USD" })).toThrow();
  expect(() => parsePrices({ ...history, last: [129.4, 131.1] })).toThrow();
});
