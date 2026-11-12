import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";

const losesDataOrGuarantees =
  /^(DROP (TABLE|SEQUENCE|FUNCTION|PROCEDURE|TRIGGER) |ALTER TABLE .* (DROP COLUMN|ALTER COLUMN .* TYPE) )/;

export function refusedLines(planSql: string) {
  return planSql.split("\n").filter((line) => losesDataOrGuarantees.test(line));
}

if (import.meta.main) {
  const { DATABASE_URL } = process.env;
  if (!DATABASE_URL) throw new Error("Set DATABASE_URL.");
  const url = new URL(DATABASE_URL);
  const host = url.hostname;
  const port = url.port || "5432";
  const user = decodeURIComponent(url.username);
  const password = decodeURIComponent(url.password);
  const planDatabase = "pgschema_plan";

  // pgschema plans by executing schema.sql, which must never run inside the target database.
  const db = new pg.Client({ connectionString: DATABASE_URL });
  await db.connect();
  const { rowCount } = await db.query(
    "select from pg_database where datname = $1",
    [planDatabase],
  );
  if (rowCount === 0) await db.query(`create database ${planDatabase}`);
  await db.end();

  const env = {
    ...process.env,
    PGHOST: host,
    PGPORT: port,
    PGDATABASE: url.pathname.slice(1),
    PGUSER: user,
    PGPASSWORD: password,
    PGSCHEMA_PLAN_HOST: host,
    PGSCHEMA_PLAN_PORT: port,
    PGSCHEMA_PLAN_DB: planDatabase,
    PGSCHEMA_PLAN_USER: user,
    PGSCHEMA_PLAN_PASSWORD: password,
  };
  const dir = mkdtempSync(join(tmpdir(), "pgschema-"));
  const planSql = join(dir, "plan.sql");
  const planJson = join(dir, "plan.json");
  const pgschema = (...args: string[]) => {
    const { status, error } = spawnSync("pgschema", [...args, "--no-color"], {
      env,
      stdio: "inherit",
    });
    if (error) throw error;
    if (status !== 0) process.exit(status ?? 1);
  };
  pgschema(
    "plan",
    "--file",
    join(import.meta.dirname, "schema.sql"),
    "--output-human",
    "stdout",
    "--output-sql",
    planSql,
    "--output-json",
    planJson,
  );

  const refused = refusedLines(readFileSync(planSql, "utf8"));
  if (refused.length > 0) {
    console.error(
      `${refused.join("\n")}\nRefused: the plan drops or retypes data, or drops a trigger or function (lines above). Back up and run the change by hand first, as CONTRIBUTING.md describes under "Change the database schema".`,
    );
    process.exit(1);
  }
  pgschema("apply", "--plan", planJson, "--auto-approve");
}
