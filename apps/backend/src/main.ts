import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { RPCHandler } from "@orpc/server/node";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { logoIdOf, storedLogo } from "./logos.ts";
import { createRouter } from "./router.ts";

const { DATABASE_URL, API_TOKEN, LOGO_DEV_SECRET_KEY } = process.env;
if (!DATABASE_URL || !API_TOKEN || !LOGO_DEV_SECRET_KEY)
  throw new Error("Set DATABASE_URL, API_TOKEN and LOGO_DEV_SECRET_KEY.");

const db = drizzle(DATABASE_URL, { casing: "snake_case" });
await migrate(db, { migrationsFolder: `${import.meta.dirname}/../drizzle` });

const authorization = `Bearer ${API_TOKEN}`;
const handler = new RPCHandler(
  createRouter(db, authorization, LOGO_DEV_SECRET_KEY),
);

async function respond(request: IncomingMessage, response: ServerResponse) {
  const logoId = logoIdOf(request.url);
  if (logoId === undefined) {
    const { matched } = await handler.handle(request, response, {
      prefix: "/rpc",
      context: { authorization: request.headers.authorization },
    });
    if (!matched) response.writeHead(404).end();
    return;
  }
  if (request.headers.authorization !== authorization) {
    response.writeHead(401).end();
    return;
  }
  const image = await storedLogo(db, logoId);
  if (!image) {
    response.writeHead(404).end();
    return;
  }
  // A logo's id never gets another image, so the browser may keep it for good.
  response
    .writeHead(200, {
      "content-type": "image/png",
      "cache-control": "private, max-age=31536000, immutable",
    })
    .end(image);
}

createServer((request, response) => {
  respond(request, response).catch((error: unknown) => {
    console.error(error);
    response.writeHead(500).end();
  });
}).listen(3000);
