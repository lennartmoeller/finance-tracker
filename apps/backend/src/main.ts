import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { implement, ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/node";
import pg from "pg";
import { contract } from "@finance-tracker/shared/contract";
import {
  createAccount,
  listAccounts,
  removeAccount,
  renameAccount,
} from "./accounts.ts";
import { fetchMissingLogos, logoIdOf, storedLogo } from "./logos.ts";
import { fillPrices, listPrices } from "./prices.ts";
import { sync } from "./sync.ts";
import { listTransactions } from "./transactions.ts";

const { DATABASE_URL, API_TOKEN, LOGO_DEV_SECRET_KEY } = process.env;
if (!DATABASE_URL || !API_TOKEN || !LOGO_DEV_SECRET_KEY)
  throw new Error("Set DATABASE_URL, API_TOKEN and LOGO_DEV_SECRET_KEY.");

// node-postgres reads a date as a local midnight, which shifts its day in other time zones.
pg.types.setTypeParser(pg.types.builtins.DATE, (date) => date);
const db = new pg.Pool({ connectionString: DATABASE_URL });
const authorization = `Bearer ${API_TOKEN}`;

const os = implement(contract)
  .$context<{ authorization: string | undefined }>()
  .use(({ context, next }) => {
    if (context.authorization !== authorization)
      throw new ORPCError("UNAUTHORIZED");
    return next();
  });

const handler = new RPCHandler(
  os.router({
    account: {
      create: os.account.create.handler(({ input }) =>
        createAccount(db, input),
      ),
      list: os.account.list.handler(() => listAccounts(db)),
      rename: os.account.rename.handler(({ input }) =>
        renameAccount(db, input),
      ),
      remove: os.account.remove.handler(({ input }) =>
        removeAccount(db, input),
      ),
    },
    sync: os.sync.handler(({ input }) => sync(db, input)),
    transaction: {
      list: os.transaction.list.handler(async () => {
        await fetchMissingLogos(db, LOGO_DEV_SECRET_KEY);
        return listTransactions(db);
      }),
    },
    price: {
      fill: os.price.fill.handler(() => fillPrices(db)),
      list: os.price.list.handler(() => listPrices(db)),
    },
  }),
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
