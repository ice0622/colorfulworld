"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  EyeOff,
  MoreHorizontal,
  Pencil,
  Send,
  Trash2,
} from "lucide-react";
import {
  publishPost,
  unpublishPost,
  deletePostAction,
} from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type PostMenuAction = "publish" | "unpublish" | "delete";

type Props = {
  post: { id: string; slug: string; title: string; draft: boolean };
  /** 一覧用：「編集」を出す */
  showEdit?: boolean;
  /** 下書きに「公開する」を出す（エディタでは主ボタンが担うので出さない） */
  showPublish?: boolean;
  onDone: (action: PostMenuAction) => void;
};

/**
 * 頻度の低い操作（状態の切替・削除）をまとめる「⋯」メニュー。
 * 項目は現在の状態に応じて入れ替わり、文言は必ず動詞（公開する／下書きに戻す）にする。
 * 削除は区切り線の下に隔離し、確認を挟む。
 */
export function PostActionsMenu({ post, showEdit, showPublish, onDone }: Props) {
  const [busy, setBusy] = useState(false);

  const run = async (action: PostMenuAction) => {
    if (
      action === "delete" &&
      !confirm(`「${post.title || "(無題)"}」を削除しますか？\nこの操作は取り消せません。`)
    ) {
      return;
    }
    setBusy(true);
    try {
      if (action === "publish") await publishPost(post.id);
      if (action === "unpublish") await unpublishPost(post.id);
      if (action === "delete") await deletePostAction(post.id);
      onDone(action);
    } finally {
      setBusy(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 px-0"
          disabled={busy}
          aria-label="その他の操作"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {showEdit && (
          <DropdownMenuItem asChild>
            <Link href={`/admin/${post.id}`}>
              <Pencil className="mr-2 h-4 w-4" />
              編集する
            </Link>
          </DropdownMenuItem>
        )}
        {!post.draft && (
          <DropdownMenuItem asChild>
            <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer">
              <ArrowUpRight className="mr-2 h-4 w-4" />
              サイトで見る
            </a>
          </DropdownMenuItem>
        )}
        {post.draft
          ? showPublish && (
              <DropdownMenuItem onSelect={() => run("publish")}>
                <Send className="mr-2 h-4 w-4" />
                公開する
              </DropdownMenuItem>
            )
          : (
              <DropdownMenuItem onSelect={() => run("unpublish")}>
                <EyeOff className="mr-2 h-4 w-4" />
                下書きに戻す
              </DropdownMenuItem>
            )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => run("delete")}>
          <Trash2 className="mr-2 h-4 w-4" />
          削除…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
