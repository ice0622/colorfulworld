import { cn } from "@/lib/utils";

/**
 * カバー画像が無いときのプレースホルダ。
 * テキストはコンポーネントで描かず、画像（public/images/no-image.svg）に焼き込む方針。
 * 文言入りの画像を作ったら、このファイルを差し替える（または下の src を変更）。
 * relative な親に敷く。
 */
export function NoImageCover({ className }: { className?: string }) {
  return (
    <div
      className={cn("absolute inset-0 bg-muted", className)}
      aria-label="画像なし"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/no-image.webp"
        alt=""
        className="h-full w-full object-cover"
      />
    </div>
  );
}
