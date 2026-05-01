/**
 * Scans all markdown posts for location values, fetches missing coordinates
 * from the Nominatim API, and updates src/lib/locations.ts automatically.
 *
 * Usage: npm run sync-locations
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { POST_LOCATIONS, locationQueryToSlug } from "../src/lib/locations";
import type { PostLocation } from "../src/lib/locations";

const POSTS_DIR = path.join(process.cwd(), "content/posts");
const LOCATIONS_FILE = path.join(process.cwd(), "src/lib/locations.ts");

async function fetchCoordinates(
  query: string
): Promise<{ lat: number; lng: number } | null> {
  // Nominatim requires at least 1 second between requests
  await new Promise((r) => setTimeout(r, 1100));

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "geek-wisp-blog/1.0 (ayase.kasagi@t8s.co.jp)",
    },
  });

  if (!res.ok) {
    console.error(`  HTTP ${res.status} for query: ${query}`);
    return null;
  }

  const data = (await res.json()) as Array<{ lat: string; lon: string }>;
  if (!data.length) return null;

  return {
    lat: parseFloat(parseFloat(data[0].lat).toFixed(4)),
    lng: parseFloat(parseFloat(data[0].lon).toFixed(4)),
  };
}

function getLocationQueriesFromPosts(): string[] {
  const files = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"));

  const queries = new Set<string>();
  for (const file of files) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf-8");
    const { data } = matter(raw);
    if (!data.location) continue;

    const locations = Array.isArray(data.location)
      ? data.location
      : [data.location];

    for (const loc of locations) {
      if (typeof loc === "string" && loc.trim()) {
        queries.add(loc.trim());
      }
    }
  }

  return Array.from(queries);
}

function generateLocationsFile(locations: PostLocation[]): string {
  const entries = locations
    .map(
      (loc) => `  {
    slug: "${loc.slug}",
    query: "${loc.query}",
    name: "${loc.name}",
    lat: ${loc.lat},
    lng: ${loc.lng},
    size: ${loc.size},
  }`
    )
    .join(",\n");

  return `export type PostLocation = {
  slug: string;
  query: string; // Nominatim API query e.g. "Tokyo, Japan"
  name: string;  // display name
  lat: number;
  lng: number;
  size: number;
};

export function locationQueryToSlug(query: string): string {
  return query.split(",")[0].trim().toLowerCase().replace(/\\s+/g, "-");
}

export const POST_LOCATIONS: PostLocation[] = [
${entries},
];
`;
}

async function main() {
  const queries = getLocationQueriesFromPosts();
  const existingSlugs = new Set(POST_LOCATIONS.map((l) => l.slug));
  const updated = [...POST_LOCATIONS];
  let hasNew = false;

  for (const query of queries) {
    const slug = locationQueryToSlug(query);
    if (existingSlugs.has(slug)) {
      console.log(`✓ Already registered: ${query} (${slug})`);
      continue;
    }

    console.log(`Fetching coordinates for: ${query}`);
    const coords = await fetchCoordinates(query);
    if (!coords) {
      console.warn(`  ⚠ Not found on Nominatim: "${query}" — skipping`);
      continue;
    }

    console.log(`  → lat: ${coords.lat}, lng: ${coords.lng}`);
    updated.push({
      slug,
      query,
      name: query.split(",")[0].trim(),
      lat: coords.lat,
      lng: coords.lng,
      size: 0.02,
    });
    existingSlugs.add(slug);
    hasNew = true;
  }

  if (!hasNew) {
    console.log("\nAll locations already registered. No changes needed.");
    return;
  }

  fs.writeFileSync(LOCATIONS_FILE, generateLocationsFile(updated), "utf-8");
  console.log(`\n✅ Updated ${LOCATIONS_FILE}`);
  console.log(
    "Tip: edit src/lib/locations.ts to set Japanese names for new entries."
  );
}

main().catch(console.error);
