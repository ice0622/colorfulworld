"use client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import { config } from "@/config";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FunctionComponent } from "react";

interface MenuItem {
  name: string;
  href: string;
  openInNewTab?: boolean;
}
const menuItems: MenuItem[] = [
  { name: "Blog", href: "/blog" },
  { name: "About", href: "/about" },
];

export const Navigation: FunctionComponent = () => {
  const pathname = usePathname();
  return (
    <nav>
      <div className="hidden md:flex items-center">
        {menuItems.map((item) => (
          <div key={item.href} className="ml-4 md:ml-8">
            <a
              href={item.href}
              target={item.openInNewTab ? "_blank" : "_self"}
              className={cn(
                "relative transition-colors duration-200",
                "hover:text-gray-900 dark:hover:text-white",
                "after:absolute after:bottom-[-2px] after:left-0 after:h-[2px] after:w-0 after:bg-current after:transition-all after:duration-300 hover:after:w-full",
                pathname === item.href
                  ? "font-semibold after:!w-full"
                  : ""
              )}
            >
              {item.name}
            </a>
          </div>
        ))}
      </div>
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger>
            <Menu size="24" />
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetDescription>
                {menuItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    target={item.openInNewTab ? "_blank" : "_self"}
                    className={cn(
                      "block py-2",
                      pathname === item.href && "font-semibold"
                    )}
                  >
                    {item.name}
                  </a>
                ))}
              </SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export const Header: FunctionComponent = () => {
  const pathname = usePathname();
  const isHome = pathname === "/";

  // ホームのみ h1、その他はブランド表示を div + aria-label
  const BrandTag = isHome ? "h1" : "div";

  return (
    <section className="flex items-center justify-between mt-4 md:mt-8 mb-8" role="banner">
      <Link href="/" aria-label={config.blog.name}>
        <BrandTag
          className="text-xl md:text-2xl font-bold tracking-tighter leading-tight"
        >
          {config.blog.name}
        </BrandTag>
      </Link>
      <Navigation />
    </section>
  );
};