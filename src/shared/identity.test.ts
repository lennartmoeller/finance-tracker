import { expect, test } from "vitest";
import { identify } from "./identity.ts";

const coffee = [
  "03.11.2026",
  "03.11.2026",
  "Café",
  "Lastschrift",
  "Kaffee",
  "",
  "-3,50",
  "EUR",
];

test("hashed identities stay those already stored, and identical fields in one sync count their occurrences", () => {
  expect(
    identify([
      { identity: { hashOf: coffee } },
      { identity: { hashOf: coffee } },
      { identity: "1c7a4d3f-9e2b-4d6f-8a3c-4b5e6f7a8b9c" },
    ]).map(({ identity }) => identity),
  ).toEqual([
    "a977641e2a4a7e342131f7cc14af09066736ea3d0381a8b2ffbc8ae28eeb77af",
    "cd72907a7664d416c26927355274c488e734c013b23d5ee7be55a573caa0efec",
    "1c7a4d3f-9e2b-4d6f-8a3c-4b5e6f7a8b9c",
  ]);
});
