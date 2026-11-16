import { expect, test } from "vitest";
import { href, parseRoute, type Route } from "./route.ts";

const parsed = (address: string) =>
  parseRoute(new URL(address, "http://localhost"));

test("every screen comes back from its address", () => {
  const routes: Route[] = [
    { view: "overview" },
    {
      view: "transactions",
      tab: "depot",
      filters: {
        account: "^ING Girokonto$",
        category: "^Food › Groceries( › |$)",
        description: "zinsen|interest & more",
      },
      sort: { column: "amount", descending: true },
      transfers: "probable",
    },
    {
      view: "transactions",
      tab: "cash",
      filters: {},
      sort: null,
      transfers: null,
    },
    { view: "accounts", accountId: 3 },
    { view: "accounts", accountId: null },
    { view: "securities", isin: "IE00B4L5Y983" },
    { view: "rules", tab: "categories" },
  ];
  for (const route of routes) expect(parsed(href(route))).toEqual(route);
});

test("an address naming nothing known opens the first screen of its view", () => {
  expect(parsed("/nowhere")).toEqual({ view: "overview" });
  expect(parsed("/transactions?brand=&transfers=all")).toEqual({
    view: "transactions",
    tab: "cash",
    filters: {},
    sort: null,
    transfers: null,
  });
  expect(parsed("/accounts/new")).toEqual({
    view: "accounts",
    accountId: null,
  });
});
