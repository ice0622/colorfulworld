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
  const [visible, setVisible] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!location) {
      setVisible(false);
      setPosts([]);
      return;
    }

    setLoading(true);
    setPosts([]);

    fetch(`/api/posts?locationSlug=${encodeURIComponent(location.slug)}&limit=all`)
      .then((res) => res.json())
      .then(({ posts: fetched }: { posts: Post[] }) => {
        setPosts(fetched);
      })
      .finally(() => setLoading(false));
  }, [location]);

  useEffect(() => {
    if (!loading && location) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    } else {
      setVisible(false);
    }
  }, [loading, location]);

  if (!location) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
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

        {/* ヘッダー */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs text-muted-foreground">{location.name}</p>
        </div>

        {/* ローディング */}
        {loading && (
          <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
            読み込み中…
          </div>
        )}

        {/* 記事一覧 */}
        {!loading && posts.length > 0 && (
          <ul className="overflow-y-auto max-h-[70vh] divide-y divide-white/10 pb-4">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="flex gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                  onClick={onClose}
                >
                  {/* サムネイル */}
                  <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-muted">
                    {post.image ? (
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px] text-center px-1">
                        No image
                      </div>
                    )}
                  </div>
                  {/* テキスト */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString("ja-JP", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                        : ""}
                    </p>
                    <h3 className="text-sm font-medium leading-snug line-clamp-2">
                      {post.title}
                    </h3>
                    {post.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {post.description}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* 記事なし */}
        {!loading && posts.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            <p className="mb-1">{location.name}</p>
            <p>この地点の記事はまだありません</p>
          </div>
        )}
      </div>
    </div>
  );
}