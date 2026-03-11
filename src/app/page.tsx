import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import GlobeWrapper from "@/components/GlobeWrapper";
import Link from "next/link";
import { config } from "@/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: config.baseUrl,
  },
};

const Page = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto px-5">
        <Header />
      </div>

      {/* メインコンテンツ：地球儀ヒーロー */}
      <main className="flex-1 flex flex-col items-center justify-center gap-6 py-10">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            旅の記録
          </h1>
        </div>
        <GlobeWrapper />

        <Link
          href="/blog"
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
        >
          すべての記事を見る →
        </Link>
      </main>

      <div className="container mx-auto px-5">
        <Footer />
      </div>
    </div>
  );
};

export default Page;
