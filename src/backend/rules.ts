type Owner = "brand_id" | "category_id";

export const rulesOf = (owner: Owner, table: string) => `coalesce((
    select json_agg(json_build_object(
      'id', rules.id,
      'requiredBrandId', rules.required_brand_id,
      'counterpartyPattern', rules.counterparty_pattern,
      'descriptionPattern', rules.description_pattern
    ) order by rules.id)
    from rules where rules.${owner} = ${table}.id
  ), '[]') as rules`;

// Needs a preceding CTE "owner" returning the id of the brand or category it saves.
export const savedRules = (owner: Owner, rules: string) => `
  input as (
    select * from rows from (jsonb_to_recordset(${rules}::jsonb) as (
      "id" integer, "requiredBrandId" integer, "counterpartyPattern" text, "descriptionPattern" text
    )) with ordinality as rule ("id", "requiredBrandId", "counterpartyPattern", "descriptionPattern", position)
  ),
  removed as (
    delete from rules using owner
    where rules.${owner} = owner.id and rules.id not in (select "id" from input where "id" is not null)
  ),
  changed as (
    update rules set
      required_brand_id = input."requiredBrandId",
      counterparty_pattern = input."counterpartyPattern",
      description_pattern = input."descriptionPattern"
    from input, owner
    where rules.id = input."id" and rules.${owner} = owner.id
  ),
  added as (
    insert into rules (${owner}, required_brand_id, counterparty_pattern, description_pattern)
    select owner.id, input."requiredBrandId", input."counterpartyPattern", input."descriptionPattern"
    from input, owner where input."id" is null order by input.position
  )
  select id from owner`;

export const matchingRule = (owner: Owner, brandId: string) => `
  select rules.${owner} as id from rules
  where rules.${owner} is not null
    and (rules.required_brand_id is null or rules.required_brand_id = ${brandId})
    and (rules.counterparty_pattern is null or cash.counterparty ~* rules.counterparty_pattern)
    and (rules.description_pattern is null or cash.description ~* rules.description_pattern)
  order by num_nonnulls(rules.required_brand_id, rules.counterparty_pattern, rules.description_pattern) desc, rules.id
  limit 1`;
