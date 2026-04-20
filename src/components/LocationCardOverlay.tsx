"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PostLocation } from "@/lib/locations";
import type { Post } from "@/types/content";

type Props = {
  location: PostLocation | null;
  onClose: () => void;
};

export default function LocationCardOverlay({ location, onClose }: Props) {
  // カード自体のフワっとアニメーション用
  const [visible, setVisible] = useState(false);
  // ランダムに選ばれた1件の記事
  const [post, setPost] = useState<Post | null>(null);
  // ローディング中かどうか
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // location が null になったらカードを閉じてデータもリセット
    if (!location) {
      setVisible(false);
      setPost(null);
      return;
    }

    // ① APIを叩く
    setLoading(true);
    setPost(null);

    // locationSlug で検索（優先）。ヒットが0件のときは tags にフォールバック
    const locationQuery = `/api/posts?locationSlug=${encodeURIComponent(location.slug)}&limit=all`;
    const tagsQuery = location.tags.join(",");
    const tagsFallbackQuery = `/api/posts?tags=${encodeURIComponent(tagsQuery)}&limit=all`;

    fetch(locationQuery)
      .then((res) => res.json())
      .then(async ({ posts: locPosts }: { posts: Post[] }) => {
        if (locPosts.length > 0) return locPosts;
        // フォールバック: tags で再検索
        const res = await fetch(tagsFallbackQuery);
        const { posts: tagPosts } = await res.json() as { posts: Post[] };
        return tagPosts;
      })
      .then((posts: Post[]) => {
        // ② image がある記事だけ絞り込む
        const withImage = posts.filter((p) => p.image);
        if (withImage.length === 0) {
          // 画像なし記事しかない場合はそのまま全件からランダム
          if (posts.length > 0) {
            setPost(posts[Math.floor(Math.random() * posts.length)]);
          }
        } else {
          // ③ ランダムに1件選ぶ
          setPost(withImage[Math.floor(Math.random() * withImage.length)]);
        }
      })
      .finally(() => setLoading(false));
  }, [location]);

  // API が終わった後にフワっとアニメーションを開始する
  useEffect(() => {
    if (!loading && location) {
      // マウント直後は opacity-0 → 次フレームで opacity-100
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    } else {
      setVisible(false);
    }
  }, [loading, location]);

  if (!location) return null;

  return (
    // 背景の半透明レイヤー。クリックで閉じる
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      {/* カード本体。クリックが背景に伝わらないよう stopPropagation */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={[
          "relative w-full max-w-sm rounded-2xl overflow-hidden",
          "bg-background/90 backdrop-blur-md border border-white/10 shadow-2xl",
          "transition-all duration-500 ease-out",
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        ].join(" ")}
      >
        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 text-white/70 hover:text-white bg-black/40 rounded-full w-7 h-7 flex items-center justify-center"
        >
          ✕
        </button>

        {/* ローディング中 */}
        {loading && (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            読み込み中…
          </div>
        )}

        {/* 記事が取得できた場合 */}
        {!loading && post && (
          <>
            {/* サムネイル画像 */}
            <div className="relative aspect-[16/9] w-full bg-muted">
              <Image
                src={post.image ?? "/images/placeholder.webp"}
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>

            {/* テキストエリア */}
            <div className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{location.name}</p>
              <h2 className="font-semibold text-base leading-snug line-clamp-2 mb-3">
                {post.title}
              </h2>
              {post.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {post.description}
                </p>
              )}

              {/* 記事を読むボタン */}
              <Link
                href={`/blog/${post.slug}`}
                className="block w-full text-center rounded-xl bg-primary text-primary-foreground py-2 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                記事を読む →
              </Link>
            </div>
          </>
        )}

        {/* 記事が見つからなかった場合 */}
        {!loading && !post && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            <p className="mb-1"> {location.name}</p>
            <p>この地点の記事はまだありません</p>
          </div>
        )}
      </div>
    </div>
  );
}