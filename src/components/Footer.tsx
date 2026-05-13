"use client";
import { config } from "@/config";
import { Rss } from "lucide-react";
import Link from "next/link";
import { FunctionComponent } from "react";
import { DarkModeToggle } from "./DarkModeToggle";
import { Button } from "./ui/button";

export const Footer: FunctionComponent = () => {
  return (
    <footer className="mt-8 md:mt-16 mb-12">
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
          <DarkModeToggle />
        </div>
      </div>
    </footer>
  );
};
