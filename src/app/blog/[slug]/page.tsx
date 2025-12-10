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
import type { Metadata, ResolvingMetadata } from "next";
import type { BlogPosting, WithContext } from "schema-dts";

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> },
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const params = await props.params;
  const { slug } = params;
  const result = await wisp.getPost(slug);

  if (!result?.post) {
    return { title: "Not Found" };
  }

  const { title, description, image } = result.post;
  const generatedOgImage = signOgImageUrl({ title, brand: config.blog.name });

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [generatedOgImage, image] : [generatedOgImage],
    },
    twitter: {
      title,
      description,
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
  const result = await wisp.getPost(slug);
  const { posts } = await wisp.getRelatedPosts({ slug, limit: 3 });

  if (!result?.post) return notFound();

  const { title, publishedAt, updatedAt, image, author } = result.post;

  // JSON-LD
  const jsonLd: WithContext<BlogPosting> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    image: image || undefined,
    datePublished: publishedAt?.toString(),
    dateModified: updatedAt?.toString(),
    author: {
      "@type": "Person",
      name: author.name,
      image: author.image,
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
};

export default Page;