"use client";
import Link from "next/link";
import { FunctionComponent, useEffect, useState } from "react";
// 共通ファイルから型と関数をインポート
import { fetchActiveTagsAndCounts, Tag } from "@/lib/tagUtils"; // パスは適宜調整

export const TagList: FunctionComponent = () => {
  // 共通の Tag[] 型を使用
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    // 共通関数を呼び出す
    const fetchTags = async () => {
      try {
        // ロジック全体がこの1行に置き換わる
        const { tags, counts } = await fetchActiveTagsAndCounts();

        // 取得した結果を state にセットする
        setTags(tags);
        setTagCounts(counts);

      } catch (err) {
        console.error("TagList でのタグ取得エラー:", err);
        // エラーハンドリング (必要に応じて)
      }
    };

    fetchTags();
  }, []); // 初回マウント時に実行

  // タグが読み込まれるまで何も表示しない (元のコードと同じ)
  if (tags.length === 0) return null;

  return (
    <section className="mt-8 md:mt-16 mb-12">
      <h2 className="text-xs font-semibold tracking-wider text-muted-foreground mb-2 border-t border-current pt-2">
        CATEGORIES
      </h2>
      <div className="flex flex-col items-start gap-1 mb-4">
        {tags.map((tag) => (
          <div key={tag.id} className="flex items-center gap-1">
            <Link
              href={`/tag/${tag.name}`}
              className="text-sm text-primary hover:underline inline underline decoration-2 underline-offset-4 decoration-transparent hover:decoration-primary transition"
            >
              {tag.name}
            </Link>
            <span className="text-xs text-muted-foreground">
              {/* stateに保存されたカウントを表示 */}
              ({tagCounts[tag.id] || 0})
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};