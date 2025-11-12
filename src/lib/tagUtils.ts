import { wisp } from "@/lib/wisp"; // sitemap.ts と同じ SDK を使う

// タグ型 (共通)
export interface Tag {
  id: string;
  name: string;
  description?: string | null;
}

// 記事型 (wisp SDK が返す型を想定)
interface Post {
  id: string;
  tags: Tag[];
  // ... 他のプロパティ
}

// 返り値の型
interface TagFetchResult {
  tags: Tag[]; // 重複除去済みのタグリスト
  counts: Record<string, number>; // タグごとの記事数
}

/**
 * 記事から使用中のタグリストと、各タグの記事数を取得します
 * (wisp SDK バージョン)
 */
export async function fetchActiveTagsAndCounts(): Promise<TagFetchResult> {
  try {
    // sitemap.ts と同じ wisp.getPosts を呼ぶ
    const data = await wisp.getPosts({ limit: 1000 }); // 全記事取得を試みる

    const counts: Record<string, number> = {};
    const allTagsMap: Map<string, Tag> = new Map();

    data.posts.forEach((post: Post) => {
      // post.tags が存在し、配列であることを確認
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach((tag) => {
          if (!allTagsMap.has(tag.id)) {
            allTagsMap.set(tag.id, tag); // タグ情報を保存
          }
          counts[tag.id] = (counts[tag.id] || 0) + 1; // カウントを増やす
        });
      }
    });

    const allTags = Array.from(allTagsMap.values()); // Mapから配列に変換

    return { tags: allTags, counts: counts };

  } catch (err) {
    console.error("タグ取得エラー (wisp SDK):", err);
    return { tags: [], counts: {} };
  }
}