import { z } from "zod";

// 管理画面の記事フォーム。category は tags+location から自動導出するのでフォームには持たない。
export const postFormSchema = z.object({
  id: z.string().uuid().optional(),
  // 下書きは未入力でも保存可。タイトル/ slug の必須化は「公開」時にチェックする
  title: z.string().default(""),
  slug: z
    .string()
    .regex(/^[a-z0-9-]*$/, "半角英数字とハイフンのみ使えます（例: my-post）")
    .default(""),
  description: z.string().default(""),
  bodyMd: z.string().default(""),
  coverImage: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  location: z.array(z.string()).default([]),
  metaTags: z.array(z.string()).default([]),
  publishedAt: z.string().nullable().optional(), // YYYY-MM-DD or ISO
  featured: z.boolean().default(false),
});

export type PostFormValues = z.infer<typeof postFormSchema>;
