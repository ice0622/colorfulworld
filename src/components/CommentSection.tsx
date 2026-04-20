"use client";

interface CommentSectionProps {
  slug: string;
}

// TODO: Wisp依存を除去済み。独自コメントバックエンド実装まで非表示。
export function CommentSection({ slug: _ }: CommentSectionProps) {
  return null;
}
