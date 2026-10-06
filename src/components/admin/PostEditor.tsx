"use client";

import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Code2, Eye, PenLine, Settings2 } from "lucide-react";
import { postFormSchema, type PostFormValues } from "@/lib/admin/post-schema";
import { saveDraft, saveAndPublish } from "@/app/(admin)/admin/actions";
import { slugify } from "@/lib/admin/slugify";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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
import { PostContent, PostHeader } from "@/components/BlogPostContent";
import { ChipInput } from "./ChipInput";
import { ImageUploader, uploadImage } from "./ImageUploader";
import { EditorToolbar } from "./EditorToolbar";
import { PostStatusBadge } from "./PostStatusBadge";
import { PostActionsMenu, type PostMenuAction } from "./PostActionsMenu";
import type { WysiwygHandle } from "./WysiwygEditor";

// WYSIWYG は DOM 依存なのでクライアント専用で読み込む
const WysiwygEditor = dynamic(() => import("./WysiwygEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[40vh] items-center justify-center text-sm text-muted-foreground">
      エディタを読み込み中…
    </div>
  ),
});

type Props = {
  initial?: Partial<PostFormValues> & { id?: string; draft?: boolean };
};

/** visual＝公開記事と同じ見た目で編集 / markdown＝原文 / preview＝本番と同じ描画で確認 */
type Mode = "visual" | "markdown" | "preview";

const MODES: { key: Mode; label: string; icon: typeof PenLine }[] = [
  { key: "visual", label: "ビジュアル", icon: PenLine },
  { key: "markdown", label: "Markdown", icon: Code2 },
  { key: "preview", label: "プレビュー", icon: Eye },
];

/** textarea を内容の高さに合わせて伸ばす（タイトル・Markdown 原文用） */
function useAutosize(ref: React.RefObject<HTMLTextAreaElement | null>, value: string) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [ref, value]);
}

/**
 * 公開記事の h1 の中にそのまま置くタイトル入力欄（書体・字間・揃えは h1 から受け継ぐ）。
 * 高さ合わせは PostHeader が h1 を測るより先に済ませる必要があるため、
 * 子であるこのコンポーネント内の layout effect で行う。
 */
const TitleInput = forwardRef<
  HTMLTextAreaElement,
  { value: string; onChange: (value: string) => void }
>(function TitleInput({ value, onChange }, ref) {
  const innerRef = useRef<HTMLTextAreaElement>(null);
  useAutosize(innerRef, value);
  return (
    <textarea
      ref={(el) => {
        innerRef.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      }}
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\n/g, ""))}
      onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
      placeholder="タイトル"
      aria-label="タイトル"
      className="block w-full resize-none overflow-hidden bg-transparent p-0 outline-none placeholder:text-muted-foreground/50"
      style={{ textAlign: "inherit" }}
    />
  );
});

export function PostEditor({ initial }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  // 新規記事は下書き扱い。保存後の状態はサーバーの結果に合わせて更新する
  const [isDraft, setIsDraft] = useState(initial?.draft ?? true);
  const [savedSlug, setSavedSlug] = useState(initial?.slug ?? "");
  const [mode, setMode] = useState<Mode>("visual");
  const editorRef = useRef<WysiwygHandle>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const markdownRef = useRef<HTMLTextAreaElement>(null);
  // Markdown モードに入った時点の本文。戻るときに差分があればビジュアル側へ反映する
  const markdownAtEnter = useRef("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors, isDirty },
  } = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      id: initial?.id,
      title: initial?.title ?? "",
      slug: initial?.slug ?? "",
      seoTitle: initial?.seoTitle ?? "",
      description: initial?.description ?? "",
      bodyMd: initial?.bodyMd ?? "",
      coverImage: initial?.coverImage ?? null,
      camera: initial?.camera ?? "",
      lens: initial?.lens ?? "",
      filmStock: initial?.filmStock ?? "",
      tags: initial?.tags ?? [],
      location: initial?.location ?? [],
      metaTags: initial?.metaTags ?? [],
      publishedAt: initial?.publishedAt ? initial.publishedAt.slice(0, 10) : null,
      featured: initial?.featured ?? false,
    },
  });

  // 未保存の変更があるか（isDirty）を正しく出すため、手動の setValue も dirty 扱いにする
  const setField = <K extends keyof PostFormValues>(key: K, value: PostFormValues[K]) =>
    setValue(key, value as never, { shouldDirty: true });

  const title = watch("title");
  const tags = watch("tags");
  const location = watch("location");
  const cover = watch("coverImage");
  const bodyMd = watch("bodyMd");

  useAutosize(markdownRef, mode === "markdown" ? bodyMd : "");

  // 未保存のまま閉じる・リロードするときはブラウザの確認を出す
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const onTitleChange = (value: string) => {
    setField("title", value);
    if (!slugTouched) {
      const s = slugify(value);
      if (s) setField("slug", s);
    }
  };

  const changeMode = (next: Mode) => {
    if (next === mode) return;
    if (next === "markdown") markdownAtEnter.current = getValues("bodyMd");
    if (mode === "markdown" && getValues("bodyMd") !== markdownAtEnter.current) {
      editorRef.current?.setMarkdown(getValues("bodyMd"));
    }
    setMode(next);
  };

  // 画像の挿入先：ビジュアルはカーソル位置のブロック、Markdown は原文のカーソル位置
  const insertImages = (urls: string[]) => {
    if (mode !== "markdown") {
      editorRef.current?.insertImages(urls);
      return;
    }
    const el = markdownRef.current;
    const md = getValues("bodyMd");
    const at = el?.selectionStart ?? md.length;
    const before = md.slice(0, at);
    const after = md.slice(at);
    const lead = before === "" || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
    const insert = lead + urls.map((u) => `![](${u})`).join("\n\n") + "\n\n";
    setField("bodyMd", before + insert + after);
  };

  /** publish=true：公開する（公開中なら変更を反映）。false：下書きのまま保存 */
  const doSave = async (values: PostFormValues, publish: boolean) => {
    let payload = values;

    if (publish) {
      // 公開はタイトル必須。slug は未入力なら自動生成を試す
      if (!values.title.trim()) {
        titleRef.current?.focus();
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
      toast({
        description: !publish
          ? "下書きを保存しました"
          : isDraft
            ? "公開しました"
            : "変更をサイトに反映しました",
      });
      if (publish) setIsDraft(false);
      setSavedSlug(res.slug);
      // 保存した内容を基準に戻す（保存中に打った分は未保存として残る）
      reset({ ...payload, id: res.id }, { keepValues: true });
      if (!payload.id) router.replace(`/admin/${res.id}`);
      else router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const onSave = handleSubmit((v) => doSave(v, false));
  const onPublish = handleSubmit((v) => doSave(v, true));

  const onMenuDone = (action: PostMenuAction) => {
    if (action === "delete") {
      router.push("/admin");
      return;
    }
    setIsDraft(action === "unpublish");
    toast({ description: action === "unpublish" ? "下書きに戻しました（サイトから非表示）" : "公開しました" });
    router.refresh();
  };

  return (
    <div className="pb-28">
      {/* 操作バー：左＝今の状態とモード、右＝この状態でできる操作 */}
      <div className="sticky top-0 z-20 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-background/80 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <PostStatusBadge draft={isDraft} />
          {isDirty && (
            <span className="text-xs text-muted-foreground">未保存の変更あり</span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* 表示モード切替（セグメント） */}
          <div className="flex rounded-md border border-border/60 p-0.5" role="tablist" aria-label="表示モード">
            {MODES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={mode === key}
                title={label}
                onClick={() => changeMode(key)}
                className={cn(
                  "flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors",
                  mode === key
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPanelOpen(true)}
            aria-label="記事の設定"
          >
            <Settings2 className="h-4 w-4 md:mr-1" />
            <span className="hidden md:inline">設定</span>
          </Button>

          {isDraft ? (
            <>
              <Button type="button" variant="outline" size="sm" onClick={onSave} disabled={saving}>
                保存
              </Button>
              <Button type="button" size="sm" onClick={onPublish} disabled={saving}>
                公開する
              </Button>
            </>
          ) : (
            // 公開中の保存＝即サイトに反映。「下書き保存」と誤解させない文言にする
            <Button type="button" size="sm" onClick={onPublish} disabled={saving}>
              変更を反映
            </Button>
          )}

          {initial?.id && (
            <PostActionsMenu
              post={{ id: initial.id, slug: savedSlug, title, draft: isDraft }}
              onDone={onMenuDone}
            />
          )}
        </div>
      </div>

      {/* 本文：公開記事ページ（blog/[slug]）と同じ外枠・冒頭・本文列で組む */}
      <div className="container mx-auto px-5">
        {mode === "preview" ? (
          <PostPreview title={title} cover={cover ?? null} bodyMd={bodyMd} />
        ) : (
          <>
            <PostHeader
              title={title}
              image={cover}
              titleSlot={
                <TitleInput ref={titleRef} value={title} onChange={onTitleChange} />
              }
            />

            <div className="mx-auto max-w-2xl">
              {/* ビジュアルは常にマウントしておき、モード切替で状態（カーソル等）を失わない */}
              <div className={cn(mode !== "visual" && "hidden")}>
                <WysiwygEditor
                  ref={editorRef}
                  defaultValue={initial?.bodyMd ?? ""}
                  onChange={(md) => setField("bodyMd", md)}
                  onUpload={(f) => uploadImage(f).then((r) => r.url)}
                />
              </div>
              {mode === "markdown" && (
                <textarea
                  ref={markdownRef}
                  value={bodyMd}
                  onChange={(e) => setField("bodyMd", e.target.value)}
                  spellCheck={false}
                  aria-label="本文（Markdown）"
                  className="markdown-source min-h-[50vh]"
                />
              )}
            </div>
          </>
        )}
      </div>

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
                onChange={(e) => onTitleChange(e.target.value)}
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
                SEOタイトル（検索用・任意）
              </label>
              <Input
                {...register("seoTitle")}
                placeholder="例: お花のお都 おフランス｜Nikon FE × Portra 400で撮るパリのフィルム作例"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                未入力なら記事タイトルを使用。検索結果の見出し・ブラウザのタブに使われます（ページ上の見出しは変わりません）。
              </p>
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
                onChange={(v) => setField("tags", v)}
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
                onChange={(v) => setField("location", v)}
                placeholder="例: Tokyo, Japan"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                撮影データ（作例・任意）
              </label>
              <div className="grid gap-2">
                <Input {...register("camera")} placeholder="カメラ（例: Nikon FE）" />
                <Input {...register("lens")} placeholder="レンズ（例: Ai Nikkor 50mm f/2.0）" />
                <Input {...register("filmStock")} placeholder="フィルム（例: Kodak Portra 400）" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                入力すると記事に「撮影データ」として表示され、検索の手がかりになります。
              </p>
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
              <ImageUploader onUploaded={(url) => setField("coverImage", url)} />
              {cover && (
                <div className="mt-2 flex items-start gap-2">
                  <div className="relative h-20 w-32 overflow-hidden rounded border border-input">
                    <Image src={cover} alt="" fill className="object-cover" sizes="128px" />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setField("coverImage", null)}
                  >
                    削除
                  </Button>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* 執筆中つねに見える固定ツールバー（画像を追加）。プレビュー中は編集しないので隠す */}
      {mode !== "preview" && <EditorToolbar onInsertMany={insertImages} />}
    </div>
  );
}

/**
 * 本番と同一パイプライン（/api/admin/preview → markdownToHtml → PostContent）で描画する確認用表示。
 * ビジュアル編集は編集用 UI（画像のリサイズ枠・コードの言語選択など）が乗るため、
 * 「公開したらどう見えるか」の最終確認はここで行う。
 */
function PostPreview({
  title,
  cover,
  bodyMd,
}: {
  title: string;
  cover: string | null;
  bodyMd: string;
}) {
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: bodyMd }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { html: string }) => !cancelled && setHtml(d.html))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [bodyMd]);

  return (
    <>
      <PostHeader title={title || "（無題）"} image={cover} />
      <div className="prose prose-neutral mx-auto max-w-2xl break-words">
        {failed ? (
          <p className="text-sm text-muted-foreground">プレビューを生成できませんでした。</p>
        ) : html === null ? (
          <p className="text-sm text-muted-foreground">プレビューを生成中…</p>
        ) : (
          <PostContent content={html} animate={false} />
        )}
      </div>
    </>
  );
}
