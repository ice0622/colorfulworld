"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Settings2 } from "lucide-react";
import { postFormSchema, type PostFormValues } from "@/lib/admin/post-schema";
import { saveDraft, saveAndPublish } from "@/app/(admin)/admin/actions";
import { slugify } from "@/lib/admin/slugify";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ChipInput } from "./ChipInput";
import { ImageUploader, uploadImage } from "./ImageUploader";

// WYSIWYG は DOM 依存なのでクライアント専用で読み込む
const WysiwygEditor = dynamic(() => import("./WysiwygEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[60vh] items-center justify-center rounded-md border border-input text-sm text-muted-foreground">
      エディタを読み込み中…
    </div>
  ),
});

type Props = {
  initial?: Partial<PostFormValues> & { id?: string };
};

export function PostEditor({ initial }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
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
      publishedAt: initial?.publishedAt ? initial.publishedAt.slice(0, 10) : null,
      featured: initial?.featured ?? false,
    },
  });

  const title = watch("title");
  const tags = watch("tags");
  const location = watch("location");
  const cover = watch("coverImage");

  const doSave = async (values: PostFormValues, publish: boolean) => {
    let payload = values;

    if (publish) {
      // 公開はタイトル必須。slug は未入力なら自動生成を試す
      if (!values.title.trim()) {
        setPanelOpen(true);
        toast({ variant: "destructive", description: "公開にはタイトルが必要です" });
        return;
      }
      if (!values.slug.trim()) {
        const s = slugify(values.title);
        if (!s) {
          setPanelOpen(true);
          toast({ variant: "destructive", description: "slug を入力してください（半角英数字）" });
          return;
        }
        payload = { ...values, slug: s };
        setValue("slug", s);
      }
    }

    setSaving(true);
    try {
      const res = publish
        ? await saveAndPublish(payload)
        : await saveDraft(payload);
      if (!res.ok) {
        toast({ variant: "destructive", description: res.error });
        return;
      }
      toast({ description: publish ? "公開しました" : "下書き保存しました" });
      if (!payload.id) router.replace(`/admin/${res.id}`);
      else router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const onSaveDraft = handleSubmit((v) => doSave(v, false));
  const onPublish = handleSubmit((v) => doSave(v, true));

  return (
    <div className="pb-24">
      {/* アクションバー */}
      <div className="sticky top-0 z-20 -mx-4 mb-4 flex items-center justify-between gap-2 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur">
        <span className="min-w-0 truncate text-sm">
          {title ? (
            <span className="font-medium text-foreground">{title}</span>
          ) : (
            <span className="text-muted-foreground">無題の記事</span>
          )}
        </span>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPanelOpen(true)}
          >
            <Settings2 className="mr-1 h-4 w-4" />
            設定
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onSaveDraft} disabled={saving}>
            下書き保存
          </Button>
          <Button type="button" size="sm" onClick={onPublish} disabled={saving}>
            公開
          </Button>
        </div>
      </div>

      {/* 本文（主役）：Obsidian 風インライン WYSIWYG（1ペイン・ずれ無し） */}
      <WysiwygEditor
        defaultValue={initial?.bodyMd ?? ""}
        onChange={(md) => setValue("bodyMd", md)}
        onUpload={uploadImage}
      />

      {/* メタ情報サイドパネル */}
      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>記事の設定</SheetTitle>
            <SheetDescription>
              タイトル・slug などは公開前に整えればOK
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 grid gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                タイトル
              </label>
              <Input
                value={title}
                onChange={(e) => {
                  setValue("title", e.target.value);
                  if (!slugTouched) {
                    const s = slugify(e.target.value);
                    if (s) setValue("slug", s);
                  }
                }}
                placeholder="記事タイトル"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                slug（URL・半角英数字）
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

            <div>
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
              <input id="featured" type="checkbox" {...register("featured")} className="h-4 w-4" />
              <label htmlFor="featured" className="text-sm">
                注目記事にする
              </label>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                サムネイル画像（任意）
              </label>
              <ImageUploader onUploaded={(url) => setValue("coverImage", url)} />
              {cover && (
                <div className="mt-2 flex items-start gap-2">
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
        </SheetContent>
      </Sheet>
    </div>
  );
}
