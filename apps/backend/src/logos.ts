import { eq, notExists } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { brands, logos, securities } from "./schema.ts";

type Identifier = { domain: string } | { isin: string };

const route = "/logos/";
// Logo.dev's free plan allows 5 concurrent API requests.
const concurrentRequests = 5;
const timeout = 5000;

export const logoPath = (id: number | null) =>
  id === null ? null : `${route}${id.toString()}`;

export function logoIdOf(url = "") {
  const id = url.startsWith(route) ? url.slice(route.length) : "";
  return /^\d+$/.test(id) ? Number(id) : undefined;
}

export async function storedLogo(db: NodePgDatabase, id: number) {
  const [logo] = await db
    .select({ image: logos.image })
    .from(logos)
    .where(eq(logos.id, id));
  return logo?.image ?? undefined;
}

async function download(identifier: Identifier, secretKey: string) {
  const lookup = await fetch(
    `https://api.logo.dev/v2/brands/logo?${new URLSearchParams(identifier).toString()}`,
    {
      headers: { authorization: `Bearer ${secretKey}` },
      signal: AbortSignal.timeout(timeout),
    },
  );
  if (lookup.status === 404) return { ...identifier, image: null, etag: null };
  if (lookup.status !== 200)
    throw new Error(`Logo.dev answered ${lookup.status.toString()}.`);
  const { data } = (await lookup.json()) as {
    data: { url: string; etag: string };
  };
  const url = new URL(data.url);
  url.searchParams.set("format", "png");
  url.searchParams.set("size", "256");
  const image = await fetch(url, { signal: AbortSignal.timeout(timeout) });
  if (!image.ok)
    throw new Error(`The logo download answered ${image.status.toString()}.`);
  return {
    ...identifier,
    image: Buffer.from(await image.arrayBuffer()),
    etag: data.etag,
  };
}

async function fetchMissing(db: NodePgDatabase, secretKey: string) {
  const missing: Identifier[] = [
    ...(await db
      .select({ domain: brands.domain })
      .from(brands)
      .where(
        notExists(
          db.select().from(logos).where(eq(logos.domain, brands.domain)),
        ),
      )),
    ...(await db
      .select({ isin: securities.isin })
      .from(securities)
      .where(
        notExists(
          db.select().from(logos).where(eq(logos.isin, securities.isin)),
        ),
      )),
  ];
  for (let start = 0; start < missing.length; start += concurrentRequests) {
    const batch = missing.slice(start, start + concurrentRequests);
    const results = await Promise.allSettled(
      batch.map((identifier) => download(identifier, secretKey)),
    );
    const fetched = results.flatMap((result, index) => {
      if (result.status === "fulfilled") return [result.value];
      console.warn(
        `No logo stored for ${Object.values(batch[index] ?? {}).join()}, retried on the next read:`,
        result.reason,
      );
      return [];
    });
    if (fetched.length)
      await db.insert(logos).values(fetched).onConflictDoNothing();
  }
}

let fetching: Promise<void> | undefined;

// Concurrent reads share one run, so together they stay within Logo.dev's limit.
export function fetchMissingLogos(db: NodePgDatabase, secretKey: string) {
  fetching ??= fetchMissing(db, secretKey).finally(() => {
    fetching = undefined;
  });
  return fetching;
}
