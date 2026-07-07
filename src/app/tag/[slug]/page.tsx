import { BlogPostsPreview } from "@/components/BlogPostPreview";
import { BlogPostsPagination } from "@/components/BlogPostsPagination";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { config } from "@/config";
import { signOgImageUrl } from "@/lib/og-image";
import { getPosts } from "@/lib/content";
import { CircleX } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Params {
  slug: string;
}

export async function generateMetadata(
  props: {
    params: Promise<Params>;
  }
) {
  const params = await props.params;

  const {
    slug
  } = params;

  return {
    title: `#${slug}`,
    description: `#${slug} タグの記事一覧`,
    alternates: { canonical: `${config.baseUrl}/tag/${slug}` },
    openGraph: {
      title: `#${slug}`,
      description: `#${slug} タグの記事一覧`,
      images: [signOgImageUrl({ title: `#${slug}`, brand: config.blog.name })],
    },
  };
}

const Page = async (
  props: {
    params: Promise<Params>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  }
) => {
  const searchParams = await props.searchParams;
  const params = await props.params;

  const {
    slug
  } = params;

  const page = searchParams.page ? parseInt(searchParams.page as string) : 1;
  const result = await getPosts({ limit: 6, tags: [slug], page });

  // 記事が1件もないタグページ（旧タグ・大文字小文字違い・範囲外ページ）は
  // ソフト404を避けるため 404 を返す
  if (result.posts.length === 0) return notFound();

  return (
    <div className="container mx-auto px-5 mb-10">
      <Header />
      <Link href="/">
        <Badge className="px-2 py-1">
          <CircleX className="inline-block w-4 h-4 mr-2" />
          Posts tagged with <strong className="mx-2">#{slug}</strong>{" "}
        </Badge>
      </Link>
      <BlogPostsPreview posts={result.posts} />
      <BlogPostsPagination
        pagination={result.pagination}
        basePath={`/tag/${slug}/?page=`}
      />
      <Footer />
    </div>
  );
};

export default Page;
