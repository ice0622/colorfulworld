// タイトルから URL slug を生成（半角英数字とハイフンのみ）。
// 日本語など ASCII 以外しか無い場合は空文字を返す → 自動入力せず手入力に委ねる。
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
