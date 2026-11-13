import { ORPCError } from "@orpc/server";
import { expect, test } from "vitest";
import { withApiErrors } from "./database-errors.ts";

const refusal = (code: string, constraint: string | undefined, message = "") =>
  Promise.reject(Object.assign(new Error(message), { code, constraint }));

test("a refusal becomes the API error of its kind, worded by its constraint, an override or PostgreSQL", async () => {
  await expect(
    withApiErrors(refusal("23505", "brands_name_key")),
  ).rejects.toMatchObject({
    code: "CONFLICT",
    message: "Another brand has this name.",
  });
  await expect(
    withApiErrors(refusal("23503", "categories_parent_id_fkey"), {
      categories_parent_id_fkey: "Delete or move its subcategories first.",
    }),
  ).rejects.toMatchObject({
    code: "CONFLICT",
    message: "Delete or move its subcategories first.",
  });
  await expect(
    withApiErrors(
      refusal(
        "2201B",
        undefined,
        "invalid regular expression: parentheses () not balanced",
      ),
    ),
  ).rejects.toMatchObject({
    code: "BAD_REQUEST",
    message: "invalid regular expression: parentheses () not balanced",
  });
});

test("any other error passes through unchanged", async () => {
  const unreachable = new Error("connect ECONNREFUSED");
  await expect(withApiErrors(Promise.reject(unreachable))).rejects.toBe(
    unreachable,
  );
  await expect(
    withApiErrors(refusal("40001", undefined)),
  ).rejects.not.toBeInstanceOf(ORPCError);
});
