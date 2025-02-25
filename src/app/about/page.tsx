import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { config } from "@/config";
import { signOgImageUrl } from "@/lib/og-image";
import Markdown from "react-markdown";

const content = `
### やあ

彩世です

My name is Ayase.

23です

I am 23 years old.

NikonFE + Ai Nikkor 50mm f/2.0とiPhone 15 Proをよく使っています

The equipment used is Nikon FE + Ai Nikkor 50mm f2.0 and iPhone 15 Pro.

### なぜ写真を撮るのか

最近見た『チ。 ―地球の運動について―』 で腑に落ちたセリフがあります

There’s a line from the movie *Chii. -About the Earth's Movement-* that resonated with me.

>*多分感動は寿命の長さより大切なものだと思う。*
>
>*I believe that probably, emotion is more important than the length of life.*

人それぞれ感動はあると思います

Everyone has their own way of feeling moved.

素晴らしい景色を見た時、美味しいものを食べた時、愛する家族と過ごしている時

When seeing a wonderful view, eating something delicious, or spending time with loved ones.

胸にいっぱいに広がる感情

The overwhelming feelings that spread in your chest.

その感情を呼び起こすための鍵として大切に保存しておくために写真を撮っています

I take photos as a key to preserving and evoking those emotions.

### おわりに

自分が好きな時に更新していきます

I will update it when I like it.
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
