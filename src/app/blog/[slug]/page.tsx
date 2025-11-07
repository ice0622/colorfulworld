import { BlogPostContent } from "@/components/BlogPostContent";
import { CommentSection } from "@/components/CommentSection";
import LikeButton from "@/components/LikeButton";
import { TagList } from "@/components/TagList";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { RelatedPosts } from "@/components/RelatedPosts";
import { config } from "@/config";
import { signOgImageUrl } from "@/lib/og-image";
import { wisp } from "@/lib/wisp";
import { notFound } from "next/navigation";
import type { BlogPosting, WithContext } from "schema-dts";

interface Params {
  slug: string;
}

// ✅ メタデータ生成（SEO / OGP）
export async function generateMetadata(props: { params: Promise<Params> }) {
  const params = await props.params; // ← 必要！
  const { slug } = params; // ← Promiseではない！

  const result = await wisp.getPost(slug);
  if (!result?.post) {
    return { title: "記事が見つかりません" };
  }

  const { title, description, image } = result.post;
  const generatedOgImage = signOgImageUrl({ title, brand: config.blog.name });

  return {
    title: `${title} | ${config.blog.name}`,
    description,
    openGraph: {
      title: `${title} | ${config.blog.name}`,
      description,
      images: image ? [generatedOgImage, image] : [generatedOgImage],
    },
  };
}

// ✅ メインページ
export default async function Page(props: { params: Promise<Params> }) {
  const params = await props.params;
  const { slug } = params;

  const result = await wisp.getPost(slug);
  if (!result?.post) return notFound();

  const { posts } = await wisp.getRelatedPosts({ slug, limit: 3 });
  const { title, publishedAt, updatedAt, image, author } = result.post;

  // JSON-LD構造化データ
  const jsonLd: WithContext<BlogPosting> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    image: image || undefined,
    datePublished: publishedAt ? new Date(publishedAt).toISOString() : undefined,
    dateModified: new Date(updatedAt).toISOString(),
    author: {
      "@type": "Person",
      name: author?.name || undefined,
      image: author?.image || undefined,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container mx-auto px-5">
        <Header />
        <div className="max-w-prose mx-auto text-xl">
          <BlogPostContent post={result.post} />
          <LikeButton postId={result.post.id} />
          <RelatedPosts posts={posts} />
          <CommentSection slug={slug} />
        </div>
        <TagList />
        <Footer />
      </div>
    </>
  );
}
