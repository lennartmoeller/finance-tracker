import { ORPCError } from "@orpc/server";
import type { DatabaseError } from "pg";

const codes: Record<string, "CONFLICT" | "BAD_REQUEST"> = {
  "23505": "CONFLICT",
  "23503": "CONFLICT",
  "23514": "BAD_REQUEST",
  "2201B": "BAD_REQUEST",
};

const messages: Record<string, string> = {
  accounts_bank_name_key: "This bank already has an account with this name.",
  accounts_bank_number_key:
    "This bank already has an account with this number.",
  brands_name_key: "Another brand has this name.",
  brands_name_filled: "Name the brand.",
  brands_domain_key: "Another brand has this domain.",
  brands_domain_format:
    "Write the domain as a lowercase host name, such as lidl.de.",
  categories_parent_id_name_key:
    "Another category with the same parent has this name.",
  categories_name_filled: "Name the category.",
  rules_condition_given: "Give each rule at least one condition.",
  rules_counterparty_pattern_valid:
    "A counterparty pattern matches every transaction.",
  rules_description_pattern_valid:
    "A description pattern matches every transaction.",
};

export async function withApiErrors<T>(
  query: Promise<T>,
  overrides: Record<string, string> = {},
): Promise<T> {
  try {
    return await query;
  } catch (error) {
    const { code, constraint, message } = error as DatabaseError;
    const apiCode = code && codes[code];
    if (!apiCode) throw error;
    throw new ORPCError(apiCode, {
      message:
        (constraint && (overrides[constraint] ?? messages[constraint])) ??
        message,
    });
  }
}
