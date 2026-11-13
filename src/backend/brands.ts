import { ORPCError } from "@orpc/server";
import type { Pool } from "pg";
import type { Brand, RuleInput } from "@finance-tracker/shared/contract";
import { withApiErrors } from "./database-errors.ts";
import { logoRoute } from "./logos.ts";
import { rulesOf, savedRules } from "./rules.ts";

type Saved = Pick<Brand, "name" | "domain"> & { rules: RuleInput[] };

const brandNotFound = () =>
  new ORPCError("NOT_FOUND", { message: "The brand does not exist." });

export const listBrands = async (db: Pool) =>
  (
    await db.query<Brand>(
      `select brands.id, brands.name, brands.domain, $1::text || logos.id as logo, ${rulesOf("brand_id", "brands")}
      from brands
      left join logos on logos.domain = brands.domain and logos.image is not null
      order by brands.id`,
      [logoRoute],
    )
  ).rows;

export async function createBrand(db: Pool, { name, domain, rules }: Saved) {
  await withApiErrors(
    db.query(
      `with owner as (insert into brands (name, domain) values ($1, $2) returning id),
      ${savedRules("brand_id", "$3")}`,
      [name, domain, JSON.stringify(rules)],
    ),
  );
}

export async function updateBrand(
  db: Pool,
  { id, name, domain, rules }: Saved & Pick<Brand, "id">,
) {
  const { rowCount } = await withApiErrors(
    db.query(
      `with dropped_logo as (
        delete from logos using brands
        where brands.id = $1 and logos.domain = brands.domain and brands.domain <> $3
      ),
      owner as (update brands set name = $2, domain = $3 where id = $1 returning id),
      ${savedRules("brand_id", "$4")}`,
      [id, name, domain, JSON.stringify(rules)],
    ),
  );
  if (!rowCount) throw brandNotFound();
}

export async function removeBrand(db: Pool, { id }: Pick<Brand, "id">) {
  const { rows } = await db.query<{ name: string }>(
    `select distinct categories.name from rules
    join categories on categories.id = rules.category_id
    where rules.required_brand_id = $1
    order by categories.name`,
    [id],
  );
  if (rows.length)
    throw new ORPCError("CONFLICT", {
      message: `The rules of ${new Intl.ListFormat("en").format(rows.map(({ name }) => name))} require this brand; change them first.`,
    });
  const { rowCount } = await db.query("delete from brands where id = $1", [id]);
  if (!rowCount) throw brandNotFound();
}
