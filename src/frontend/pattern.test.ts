import { expect, test } from "vitest";
import { exactly, pattern } from "./pattern.ts";

test("a pattern reads as PostgreSQL's ~* reads it, umlauts and line breaks included", () => {
  expect(pattern(String.raw`\mbäck`).test("Die Bäckerei")).toBe(true);
  expect(pattern(String.raw`\mäck`).test("Bäckerei")).toBe(false);
  expect(pattern(String.raw`^\w+$`).test("öl")).toBe(true);
  expect(pattern(String.raw`^[\w-]+$`).test("ä-b")).toBe(true);
  expect(pattern(String.raw`^\s$`).test(" ")).toBe(false);
  expect(pattern("ÄPFEL").test("äpfel")).toBe(true);
  expect(pattern("a.b").test("a\nb")).toBe(true);
  expect(pattern(String.raw`a\-b`).test("a-b")).toBe(true);
  expect(() => pattern(String.raw`\bvisa`)).toThrow(String.raw`\y`);
  expect(pattern("^a]{x}{2}}$").test("a]{x}}}")).toBe(true);
  expect(pattern("^[]a]+$").test("]a")).toBe(true);
  expect(() => pattern("a{1")).toThrow();
  expect(() => pattern("a{256}")).toThrow("255");
});

test("an exact pattern matches its text alone", () => {
  const exact = pattern(exactly("ING Depot (alt) 1.0+"));
  expect(exact.test("ING Depot (alt) 1.0+")).toBe(true);
  expect(exact.test("ING Depot (alt) 1x0+")).toBe(false);
});
