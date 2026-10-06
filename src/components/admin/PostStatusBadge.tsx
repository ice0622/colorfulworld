import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 記事の「今の状態」を示すバッジ（操作ボタンではない）。
 * 状態は名詞（公開中／下書き）、操作は動詞（公開する／下書きに戻す）で書き分け、
 * 同じ語がバッジとボタンに混在しないようにする。
 * 色相は使わず「塗り●／中抜き○＋実線地／破線枠」の形と濃淡で区別する。
 */
export function PostStatusBadge({
  draft,
  className,
}: {
  draft: boolean;
  className?: string;
}) {
  return draft ? (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-border px-2 py-0.5 text-[11px] text-muted-foreground",
        className
      )}
    >
      <Circle className="h-2 w-2" strokeWidth={3} />
      下書き
    </span>
  ) : (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-transparent bg-foreground/10 px-2 py-0.5 text-[11px] font-medium text-foreground",
        className
      )}
    >
      <Circle className="h-2 w-2 fill-current" strokeWidth={3} />
      公開中
    </span>
  );
}
