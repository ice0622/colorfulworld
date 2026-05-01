import { getTags } from "@/lib/content";
import type { Tag } from "@/types/content";

export type { Tag };

// 返り値の型
interface TagFetchResult {
  tags: Tag[];
  counts: Record<string, number>;
}

/**
 * 記事から使用中のタグリストと、各タグの記事数を取得します
 */
export async function fetchActiveTagsAndCounts(): Promise<TagFetchResult> {
  try {
    return await getTags();

  } catch (err) {
    console.error("タグ取得エラー (wisp SDK):", err);
    return { tags: [], counts: {} };
  }
}