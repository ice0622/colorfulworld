import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { config } from "@/config";
import { signOgImageUrl } from "@/lib/og-image";
import Markdown from "react-markdown";

const content = `
### 自己紹介

彩世です

2001年生まれです

NikonFEとiPhone 15 Proをよく使っています

写真と旅行とゲームとバイクに乗るのが好きです

自分が好きな時に更新していきます

`;

export async function generateMetadata() {
  return {
    title: "About Me",
    description: "Learn more about Ayase and her travel adventures",
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
}

const Page = async () => {
  return (
    <div className="container mx-auto px-5">
      <Header />
      <div className="prose lg:prose-lg dark:prose-invert m-auto mt-20 mb-10 blog-content">
        <Markdown>{content}</Markdown>
      </div>
      <Footer />
    </div>
  );
};

export default Page;
