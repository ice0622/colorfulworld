import { config } from "@/config";
import { signOgImageUrl } from "@/lib/og-image";
import { cn } from "@/lib/utils";
import type { Metadata, Viewport } from "next";
import { Inter, Noto_Serif_JP, Klee_One } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import { Agentation } from "agentation";

// safe-area-inset を効かせるため viewport-fit: cover を明示（ズームは潰さない）
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans" });

const notoSerifJP = Noto_Serif_JP({
  weight: ["900"],
  subsets: ["latin"],
  variable: "--font-noto-serif-jp",
  display: "swap",
});

// 手書き風フォント（「画像なし」などの一言メモ用）
const kleeOne = Klee_One({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-hand",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://colorfulworld.jp"),
  title: {
    absolute: config.blog.metadata.title.absolute,
    default: config.blog.metadata.title.default,
    template: config.blog.metadata.title.template,
  },
  description: config.blog.metadata.description,
  openGraph: {
    title: config.blog.metadata.title.default,
    description: config.blog.metadata.description,
    url: "https://colorfulworld.jp",
    siteName: config.blog.name,
    images: [
      signOgImageUrl({
        title: config.blog.name,
      }),
    ],
  },
};

const siteSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${config.baseUrl}/#website`,
      url: config.baseUrl,
      name: config.blog.name,
      description: config.blog.metadata.description,
      inLanguage: "ja",
    },
    {
      "@type": "Person",
      "@id": `${config.baseUrl}/#person`,
      name: "Ayase",
      url: `${config.baseUrl}/about`,
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
        />
        <meta name="google-site-verification" content="Zz6bJhYQXG5-XM8xBRrvrtx1DcqdS8FzXOzolhqq_xg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Hannari&display=swap" rel="stylesheet" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased max-w-6xl m-auto",
          fontSans.variable,
          notoSerifJP.variable,
          kleeOne.variable
        )}
      >
        <Providers>
          <SpeedInsights />
          <Analytics />
          {process.env.NODE_ENV === "development" && <Agentation />}
          <main>
            <div className="max-w-4xl mx-auto px-4 pt-20">
              {children}
            </div>
          </main>
        </Providers>
      </body>
    </html>
  );
}
