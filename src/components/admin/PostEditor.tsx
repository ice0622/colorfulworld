"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { postFormSchema, type PostFormValues } from "@/lib/admin/post-schema";
import { saveDraft, saveAndPublish } from "@/app/(admin)/admin/actions";
import { slugify } from "@/lib/admin/slugify";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChipInput } from "./ChipInput";
import {
  MarkdownTextarea,
  type MarkdownTextareaHandle,
} from "./MarkdownTextarea";
import { ImageUploader, uploadImage } from "./ImageUploader";
import { LivePreview } from "./LivePreview";

type Props = {
  initial?: Partial<PostFormValues> & { id?: string };
};

export function PostEditor({ initial }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const mdRef = useRef<MarkdownTextareaHandle>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      id: initial?.id,
      title: initial?.title ?? "",
      slug: initial?.slug ?? "",
      description: initial?.description ?? "",
      bodyMd: initial?.bodyMd ?? "",
      coverImage: initial?.coverImage ?? null,
      tags: initial?.tags ?? [],
      location: initial?.location ?? [],
      metaTags: initial?.metaTags ?? [],
      publishedAt: initial?.publishedAt
        ? initial.publishedAt.slice(0, 10)
        : null,
      featured: initial?.featured ?? false,
    },
  });

  const body = watch("bodyMd");
  const title = watch("title");
  const tags = watch("tags");
  const location = watch("location");
  const metaTags = watch("metaTags");
  const cover = watch("coverImage");

  const doSave = async (values: PostFormValues, publish: boolean) => {
    setSaving(true);
    try {
      const res = publish
        ? await saveAndPublish(values)
        : await saveDraft(values);
      if (!res.ok) {
        toast({ variant: "destructive", description: res.error });
        return;
      }
      toast({ description: publish ? "公開しました" : "下書き保存しました" });
      if (!values.id) router.replace(`/admin/${res.id}`);
      else router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const onSaveDraft = handleSubmit((v) => doSave(v, false));
  const onPublish = handleSubmit((v) => doSave(v, true));

  const insertImage = async (file: File) => {
    try {
      const url = await uploadImage(file);
      mdRef.current?.insert(`\n![](${url})\n`);
      toast({ description: "画像を挿入しました" });
    } catch (e) {
      toast({
        variant: "destructive",
        description: e instanceof Error ? e.message : "アップロード失敗",
      });
    }
  };

  return (
    <div className="pb-24">
      {/* アクションバー */}
      <div className="sticky top-0 z-20 -mx-4 mb-4 flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur">
        <span className="text-sm text-muted-foreground">
          {initial?.id ? "記事を編集" : "新規記事"}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onSaveDraft} disabled={saving}>
            下書き保存
          </Button>
          <Button onClick={onPublish} disabled={saving}>
            公開
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {/* メタ情報 */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              タイトル
            </label>
            <Input
              value={title}
              onChange={(e) => {
                setValue("title", e.target.value);
                if (!slugTouched) setValue("slug", slugify(e.target.value));
              }}
              placeholder="記事タイトル"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              slug（URL）
            </label>
            <Input
              {...register("slug", { onChange: () => setSlugTouched(true) })}
              placeholder="my-post"
            />
            {errors.slug && (
              <p className="mt-1 text-xs text-destructive">{errors.slug.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              公開日
            </label>
            <Input type="date" {...register("publishedAt")} />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              概要（一覧 / OG 用）
            </label>
            <Textarea {...register("description")} rows={2} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              タグ（TRIP / TECH / LIFE でカテゴリが決まる）
            </label>
            <ChipInput
              value={tags}
              onChange={(v) => setValue("tags", v)}
              placeholder="タグを追加"
              suggestions={["TRIP", "TECH", "LIFE"]}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              ロケーション
            </label>
            <ChipInput
              value={location}
              onChange={(v) => setValue("location", v)}
              placeholder="例: Tokyo, Japan"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="featured"
              type="checkbox"
              {...register("featured")}
              className="h-4 w-4"
            />
            <label htmlFor="featured" className="text-sm">
              注目記事にする
            </label>
          </div>
        </div>

        {/* カバー画像 */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            カバー画像
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <div className="sm:w-64">
              <ImageUploader
                onUploaded={(url) => setValue("coverImage", url)}
              />
            </div>
            {cover && (
              <div className="flex items-start gap-2">
                <div className="relative h-20 w-32 overflow-hidden rounded border border-input">
                  <Image src={cover} alt="" fill className="object-cover" sizes="128px" />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setValue("coverImage", null)}
                >
                  削除
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 本文：デスクトップは 2 カラム、モバイルはタブ */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">本文</label>
            <div className="flex gap-1 lg:hidden">
              <button
                type="button"
                onClick={() => setTab("edit")}
                className={`rounded px-2 py-1 text-xs ${tab === "edit" ? "bg-muted font-medium" : "text-muted-foreground"}`}
              >
                編集
              </button>
              <button
                type="button"
                onClick={() => setTab("preview")}
                className={`rounded px-2 py-1 text-xs ${tab === "preview" ? "bg-muted font-medium" : "text-muted-foreground"}`}
              >
                プレビュー
              </button>
            </div>
          </div>

          <input
            ref={imgInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) insertImage(f);
              e.target.value = "";
            }}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <div
              className={tab === "edit" ? "block" : "hidden lg:block"}
              onDrop={(e) => {
                const f = e.dataTransfer.files?.[0];
                if (f && f.type.startsWith("image/")) {
                  e.preventDefault();
                  insertImage(f);
                }
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              <MarkdownTextarea
                ref={mdRef}
                value={body}
                onChange={(v) => setValue("bodyMd", v)}
                placeholder="Markdown で本文を書く。画像はドラッグ&ドロップ or ツールバーから。"
                onRequestImage={() => imgInputRef.current?.click()}
              />
            </div>
            <div className={tab === "preview" ? "block" : "hidden lg:block"}>
              <LivePreview body={body} title={title} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
