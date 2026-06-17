"use client";
import { config } from "@/config";
import { Rss } from "lucide-react";
import Link from "next/link";
import { FunctionComponent } from "react";
import { Button } from "./ui/button";
import { SleepingCat } from "./SleepingCat";

export const Footer: FunctionComponent = () => {
  return (
    <footer className="mt-8 md:mt-16 mb-12 max-w-2xl mx-auto w-full">
      {/* 枠のない開けた余白にゆるい寝てる猫を置く（手描きの線が映える） */}
      <div className="flex justify-center mb-10 text-muted-foreground/70">
        <SleepingCat variant="lying" size={80} />
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-muted-foreground">
          © {config.blog.copyright} {new Date().getFullYear()}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/rss" className="w-auto inline-flex">
            <Button variant="ghost" className="p-2">
              <Rss className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </footer>
  );
};
