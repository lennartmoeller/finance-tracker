import { expect, test } from "vitest";
import { holdingSpans } from "./prices.ts";

const amazon = "US0231351067";
const fund = "IE00BK1PV551";

test("selling every share ends a holding span the day before, and buying again starts the next one", () => {
  expect(
    holdingSpans(
      [
        { isin: amazon, date: "2024-07-12", quantity: "0.1" },
        { isin: amazon, date: "2024-08-01", quantity: "0.2" },
        { isin: amazon, date: "2024-08-01", quantity: null },
        { isin: amazon, date: "2024-11-07", quantity: "-0.3" },
        { isin: amazon, date: "2025-03-03", quantity: "1" },
        { isin: amazon, date: "2025-03-04", quantity: "-1" },
        { isin: amazon, date: "2025-06-02", quantity: "1" },
      ],
      "2026-11-10",
    ),
  ).toEqual([
    { isin: amazon, from: "2024-07-12", to: "2024-11-06" },
    { isin: amazon, from: "2025-03-03", to: "2025-03-03" },
    { isin: amazon, from: "2025-06-02", to: "2026-11-10" },
  ]);
});

test("a security moved from one depot to another on one day keeps one holding span, and one bought today has none yet", () => {
  expect(
    holdingSpans(
      [
        { isin: fund, date: "2025-05-02", quantity: "5" },
        { isin: fund, date: "2024-08-02", quantity: "5" },
        { isin: fund, date: "2025-05-02", quantity: "-5" },
        { isin: fund, date: "2026-11-11", quantity: "2" },
        { isin: amazon, date: "2026-11-11", quantity: "1" },
      ],
      "2026-11-10",
    ),
  ).toEqual([{ isin: fund, from: "2024-08-02", to: "2026-11-10" }]);
});
