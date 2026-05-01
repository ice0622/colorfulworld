import Link from "next/link";
import { getTags } from "@/lib/content";

export const TagList = async () => {
  const { tags, counts } = await getTags();

  if (tags.length === 0) return null;

  return (
    <section className="mt-8 md:mt-16 mb-12">
      <h2 className="text-xs font-semibold tracking-wider text-muted-foreground mb-2 border-t border-current pt-2">
        CATEGORIES
      </h2>
      <div className="flex flex-col items-start gap-1 mb-4">
        {tags.map((tag) => (
          <div key={tag.id} className="flex items-center gap-1">
            <Link
              href={`/tag/${tag.name}`}
              className="text-sm text-primary hover:underline inline underline decoration-2 underline-offset-4 decoration-transparent hover:decoration-primary transition"
            >
              {tag.name}
            </Link>
            <span className="text-xs text-muted-foreground">
              ({counts[tag.id] || 0})
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};