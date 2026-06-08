/**
 * content/posts/*.md を読み込み、Neon Postgres へ投入する一回限りの移行スクリプト。
 * slug を一意キーに upsert するので、何度実行しても重複しない（冪等）。
 * md ファイルは削除せずシード/フォールバックとして温存する。
 *
 * Usage: npm run db:migrate
 * 前提: .env.local もしくは .env に DATABASE_URL が設定されていること。
 */
import fs from "fs";
import path from "path";
import { config as loadEnv } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { posts, tags, postTags } from "../src/db/schema";
import { parsePostFrontmatter } from "../src/lib/postParse";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("✗ DATABASE_URL が未設定です。.env.local に設定してください。");
  process.exit(1);
}

const db = drizzle(neon(url), { schema: { posts, tags, postTags } });
const POSTS_DIR = path.join(process.cwd(), "content/posts");

function toDate(s: string | null): Date | null {
  return s ? new Date(s) : null;
}

async function main() {
  const filenames = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"));

  let inserted = 0;
  let skipped = 0;

  for (const filename of filenames) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, filename), "utf-8");
    const p = parsePostFrontmatter(raw);
    if (!p) {
      console.warn(`  - skip（slug 無し）: ${filename}`);
      skipped++;
      continue;
    }

    const publishedAt = toDate(p.publishedAt);
    const updatedAt = toDate(p.updatedAt);
    const createdAt = publishedAt ?? new Date();

    // posts を upsert（createdAt は更新時に保持）
    const [row] = await db
      .insert(posts)
      .values({
        slug: p.slug,
        number: p.number,
        title: p.title,
        description: p.description,
        bodyMd: p.bodyMd,
        coverImage: p.coverImage,
        category: p.category,
        featured: p.featured,
        draft: p.draft,
        location: p.location,
        metaTags: p.metaTags,
        publishedAt,
        updatedAt,
        createdAt,
      })
      .onConflictDoUpdate({
        target: posts.slug,
        set: {
          number: p.number,
          title: p.title,
          description: p.description,
          bodyMd: p.bodyMd,
          coverImage: p.coverImage,
          category: p.category,
          featured: p.featured,
          draft: p.draft,
          location: p.location,
          metaTags: p.metaTags,
          publishedAt,
          updatedAt,
        },
      })
      .returning({ id: posts.id });

    // tags を upsert し、この記事の post_tags を貼り直す
    for (const name of p.tags) {
      await db.insert(tags).values({ id: name, name }).onConflictDoNothing();
    }
    await db.delete(postTags).where(eq(postTags.postId, row.id));
    if (p.tags.length > 0) {
      await db
        .insert(postTags)
        .values(p.tags.map((name) => ({ postId: row.id, tagId: name })))
        .onConflictDoNothing();
    }

    console.log(
      `  ✓ ${p.slug}  [${p.category}]  draft=${p.draft}  tags=${p.tags.join(",") || "-"}`
    );
    inserted++;
  }

  console.log(`\n完了: ${inserted} 件 upsert / ${skipped} 件スキップ`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
