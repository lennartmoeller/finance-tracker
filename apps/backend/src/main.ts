import { createServer } from "node:http";
import { RPCHandler } from "@orpc/server/node";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createRouter } from "./router.ts";

const { DATABASE_URL, API_TOKEN } = process.env;
if (!DATABASE_URL || !API_TOKEN)
  throw new Error("Set DATABASE_URL and API_TOKEN.");

const db = drizzle(DATABASE_URL, { casing: "snake_case" });
await migrate(db, { migrationsFolder: `${import.meta.dirname}/../drizzle` });

const handler = new RPCHandler(createRouter(db, API_TOKEN));
createServer((request, response) => {
  void handler
    .handle(request, response, {
      prefix: "/rpc",
      context: { authorization: request.headers.authorization },
    })
    .then(({ matched }) => {
      if (!matched) response.writeHead(404).end();
    });
}).listen(3000);
