import { BlogPostContent } from "@/components/BlogPostContent";
import { TagList } from "@/components/TagList";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { RelatedPosts } from "@/components/RelatedPosts";
import { config } from "@/config";
import { signOgImageUrl } from "@/lib/og-image";
import { getPost, getRelatedPosts } from "@/lib/content";
import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";
import type { BlogPosting, WithContext } from "schema-dts";

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> },
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const params = await props.params;
  const { slug } = params;
  const result = await getPost(slug);

  if (!result?.post) {
    return { title: "Not Found" };
  }

  const { title, seoTitle, description, image } = result.post;
  // <title>/OG/Twitter は検索語入りの seoTitle を優先（未入力なら詩的タイトル）。
  // OG 画像カードのテキストは詩的タイトルのまま（ブランド感を保つ）。
  const metaTitle = seoTitle || title;
  const generatedOgImage = signOgImageUrl({ title, brand: config.blog.name });

  return {
    title: metaTitle,
    description,
    openGraph: {
      title: metaTitle,
      images: image ? [generatedOgImage, image] : [generatedOgImage],
    },
    twitter: {
      title: metaTitle,
      images: image ? [generatedOgImage, image] : [generatedOgImage],
    },
    alternates: {
      canonical: `${config.baseUrl}/blog/${slug}`,
    },
  };
}

const Page = async (props: { params: Promise<{ slug: string }> }) => {
  const params = await props.params;
  const { slug } = params;
  const result = await getPost(slug);
  const { posts } = await getRelatedPosts({ slug, limit: 3 });

  if (!result?.post) return notFound();

  const { title, seoTitle, publishedAt, updatedAt, image, author, tags, camera, lens, filmStock } =
    result.post;

  // cover 画像は絶対URL化（Blob は既に絶対、ルート相対なら baseUrl を前置）
  const imageUrl = image
    ? image.startsWith("http")
      ? image
      : `${config.baseUrl}${image}`
    : undefined;

  // タグ＋撮影機材を keywords に（作例検索の手がかり）
  const keywords = [...(tags?.map((t) => t.name) ?? []), camera, lens, filmStock]
    .filter(Boolean)
    .join(", ");

  // JSON-LD
  const jsonLd: WithContext<BlogPosting> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: seoTitle || title,
    image: imageUrl
      ? {
          "@type": "ImageObject",
          url: imageUrl,
          creator: { "@type": "Person", name: author ?? "Ayase" },
        }
      : undefined,
    datePublished: publishedAt?.toString(),
    dateModified: updatedAt?.toString(),
    author: { "@type": "Person", name: author ?? "Ayase" },
    keywords: keywords || undefined,
    url: `${config.baseUrl}/blog/${slug}`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${config.baseUrl}/blog/${slug}`,
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
        <div className="text-xl">
          <BlogPostContent post={result.post} slug={slug} />
          <div className="max-w-2xl mx-auto">
            <RelatedPosts posts={posts} />
          </div>
        </div>
        <TagList />
        <Footer />
      </div>
    </>
  );
};

export default Page;