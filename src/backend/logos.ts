import type { Pool } from "pg";

type Identifier = { domain: string } | { isin: string };

export const logoRoute = "/logos/";
// Logo.dev's free plan allows 5 concurrent API requests.
const concurrentRequests = 5;
const timeout = 5000;

export function logoIdOf(url = "") {
  const id = url.startsWith(logoRoute) ? url.slice(logoRoute.length) : "";
  return /^\d+$/.test(id) ? Number(id) : undefined;
}

export const storedLogo = async (db: Pool, id: number) =>
  (
    await db.query<{ image: Buffer | null }>(
      "select image from logos where id = $1",
      [id],
    )
  ).rows[0]?.image ?? undefined;

async function download(identifier: Identifier, secretKey: string) {
  const lookup = await fetch(
    `https://api.logo.dev/v2/brands/logo?${new URLSearchParams(identifier).toString()}`,
    {
      headers: { authorization: `Bearer ${secretKey}` },
      signal: AbortSignal.timeout(timeout),
    },
  );
  if (lookup.status === 404) return { ...identifier, image: null };
  if (lookup.status !== 200)
    throw new Error(`Logo.dev answered ${lookup.status.toString()}.`);
  const { data } = (await lookup.json()) as { data: { url: string } };
  const url = new URL(data.url);
  url.searchParams.set("format", "png");
  url.searchParams.set("size", "256");
  const image = await fetch(url, { signal: AbortSignal.timeout(timeout) });
  if (!image.ok)
    throw new Error(`The logo download answered ${image.status.toString()}.`);
  return {
    ...identifier,
    image: Buffer.from(await image.arrayBuffer()).toString("base64"),
  };
}

async function fetchMissing(db: Pool, secretKey: string) {
  const missing = (
    await db.query<{ identifier: Identifier }>(
      `select json_build_object('domain', domain) as identifier from brands
      where not exists (select from logos where logos.domain = brands.domain)
      union all
      select json_build_object('isin', isin) from securities
      where not exists (select from logos where logos.isin = securities.isin)`,
    )
  ).rows.map(({ identifier }) => identifier);
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
    await db.query(
      `insert into logos (domain, isin, image)
      select domain, isin, decode(image, 'base64')
      from jsonb_to_recordset($1::jsonb) as logo(domain text, isin text, image text)
      on conflict do nothing`,
      [JSON.stringify(fetched)],
    );
  }
}

let fetching: Promise<void> | undefined;

// Concurrent reads share one run, so together they stay within Logo.dev's limit.
export function fetchMissingLogos(db: Pool, secretKey: string) {
  fetching ??= fetchMissing(db, secretKey).finally(() => {
    fetching = undefined;
  });
  return fetching;
}
