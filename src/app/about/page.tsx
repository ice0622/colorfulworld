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
      <div className="flex flex-col items-center mt-16 mb-8">
        <div className="w-full max-w-md aspect-[4/3] rounded-xl overflow-hidden shadow-lg mb-8">
          <HoverShaderImage src="/images/posts/フランス/1.jpg" strength={0.7} className="w-full h-full" />
        </div>
      </div>
      <article className="prose lg:prose-lg dark:prose-invert mx-auto mt-10 mb-10 blog-content">
        <Markdown>{content}</Markdown>
      </article>
      <Footer />
    </div>
  );
}
