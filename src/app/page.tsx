import { Footer } from "@/components/Footer";
import HomeHero from "@/components/HomeHero";
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
      <main className="flex-1 items-center justify-center">
        <HomeHero />
      </main>

      <div className="container mx-auto px-5">
        <Footer />
      </div>
    </div>
  );
};

export default Page;
