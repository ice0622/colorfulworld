"use client";

import { AspectRatio } from "@radix-ui/react-aspect-ratio";
import type { GetRelatedPostsResult } from "@/types/content";
import Image from "next/image";
import Link from "next/link";
import type { FunctionComponent } from "react";
import { NoImageCover } from "@/components/NoImageCover";

export const RelatedPosts: FunctionComponent<{
  posts: GetRelatedPostsResult["posts"];
}> = ({ posts }) => {
  if (posts.length === 0) {
    return null;
  }

  return (
    <div className="my-8">
      <div className="mb-6 text-lg font-semibold tracking-tight">
        関連記事
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {posts.slice(0, 3).map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="bg-muted overflow-hidden rounded-lg relative transition-transform duration-500 ease-in-out hover:scale-105 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <AspectRatio ratio={16 / 9} className="w-full">
              {post.image ? (
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="h-full min-h-full min-w-full object-cover object-center"
                />
              ) : (
                <NoImageCover />
              )}
            </AspectRatio>
            <div className="prose prose-sm p-4">
              <h3 className="line-clamp-2">{post.title}</h3>
              <p className="line-clamp-3">{post.description}</p>
              <strong className="underline decoration-transparent hover:decoration-primary transition">
                Read Full Story
              </strong>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};