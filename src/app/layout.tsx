import { config } from "@/config";
import { signOgImageUrl } from "@/lib/og-image";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"

const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    absolute: config.blog.metadata.title.absolute,
    default: config.blog.metadata.title.default,
    template: config.blog.metadata.title.template,
  },
  description: config.blog.metadata.description,
  openGraph: {
    title: config.blog.metadata.title.default,
    description: config.blog.metadata.description,
    images: [
      signOgImageUrl({
        title: config.blog.name,
      }),
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="google-site-verification" content="5SJR2In0L-HqUbE-dpclhx3CD8bVYyu-Pr28BZbCHAY" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased max-w-6xl m-auto",
          fontSans.variable
        )}
      >
        <Providers>
          <SpeedInsights />
          <Analytics />
          <main>
            <div className="max-w-3xl mx-auto px-4">
              {children}
            </div>
          </main>
        </Providers>
      </body>
    </html>
  );
}
