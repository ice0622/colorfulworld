import { z } from "zod";

// 管理画面の記事フォーム。category は tags+location から自動導出するのでフォームには持たない。
export const postFormSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, "タイトルは必須です"),
  slug: z
    .string()
    .min(1, "slug は必須です")
    .regex(/^[\p{L}\p{N}-]+$/u, "使える文字は 文字・数字・ハイフン のみです"),
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
