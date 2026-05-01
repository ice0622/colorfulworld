import fs from "fs";
import path from "path";
import { Metadata } from "next";
import Markdown from "react-markdown";
import HoverShaderImage from "@/components/HoverShaderImage";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { config } from "@/config";
import { signOgImageUrl } from "@/lib/og-image";

// const PainterlyCanvas = dynamic(() => import("@/components/shaders/PainterlyCanvas"), { ssr: false });

export const metadata: Metadata = {
  title: "About Me",
  description: "Learn more about Ayase and her travel adventures",
  alternates: {
    canonical: `${config.baseUrl}/about`,
  },
  openGraph: {
    title: "About Me",
    description: "Learn more about Ayase and her travel adventures",
    images: [
      signOgImageUrl({
        title: "Ayase",
        label: "About Me",
        brand: config.blog.name,
      }),
    ],
  },
};

const aboutPath = path.join(process.cwd(), "content/about.md");
const content = fs.readFileSync(aboutPath, "utf-8");

export default function Page() {
  return (
    <div className="container mx-auto px-5">
      <Header />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-16 mb-16 items-start">
        <div className="w-full aspect-[4/3] rounded-xl overflow-hidden shadow-lg">
          <HoverShaderImage src="/images/posts/about.jpeg" strength={0.7} className="w-full h-full" />
        </div>
        <article className="prose lg:prose-lg dark:prose-invert blog-content">
          <Markdown>{content}</Markdown>
        </article>
      </div>
      <Footer />
    </div>
  );
}
