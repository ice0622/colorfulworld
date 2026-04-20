// wisp.ts - Wisp CMS 依存を除去済み
// CommentForm.tsx（未使用）が参照しているためスタブとして残す
// TODO: 独自コメント実装後に削除する

export const wisp = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createComment: async (_input: unknown): Promise<{ success: boolean }> => {
    throw new Error("wisp CMS は削除されました");
  },
};
