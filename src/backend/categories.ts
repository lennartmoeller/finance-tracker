import { ORPCError } from "@orpc/server";
import type { Pool } from "pg";
import type { Category, RuleInput } from "@finance-tracker/shared/contract";
import { withApiErrors } from "./database-errors.ts";
import { rulesOf, savedRules } from "./rules.ts";

type Saved = Pick<Category, "parentId" | "name"> & { rules: RuleInput[] };

const categoryNotFound = () =>
  new ORPCError("NOT_FOUND", { message: "The category does not exist." });

export const listCategories = async (db: Pool) =>
  (
    await db.query<Category>(
      `select id, parent_id as "parentId", name, ${rulesOf("category_id", "categories")}
      from categories order by id`,
    )
  ).rows;

export async function createCategory(
  db: Pool,
  { parentId, name, rules }: Saved,
) {
  await withApiErrors(
    db.query(
      `with owner as (insert into categories (parent_id, name) values ($1, $2) returning id),
      ${savedRules("category_id", "$3")}`,
      [parentId, name, JSON.stringify(rules)],
    ),
  );
}

export async function updateCategory(
  db: Pool,
  { id, parentId, name, rules }: Saved & Pick<Category, "id">,
) {
  const { rowCount } = await withApiErrors(
    db.query(
      `with owner as (update categories set parent_id = $2, name = $3 where id = $1 returning id),
      ${savedRules("category_id", "$4")}`,
      [id, parentId, name, JSON.stringify(rules)],
    ),
  );
  if (!rowCount) throw categoryNotFound();
}

export async function removeCategory(db: Pool, { id }: Pick<Category, "id">) {
  const { rowCount } = await withApiErrors(
    db.query("delete from categories where id = $1", [id]),
    { categories_parent_id_fkey: "Delete or move its subcategories first." },
  );
  if (!rowCount) throw categoryNotFound();
}
