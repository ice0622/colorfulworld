// ドメイン型 - Wisp依存なしの自前型定義

export interface PostTag {
  id: string;   // タグ名をそのままIDとして使用
  name: string;
}

export interface Post {
  id: string;          // slug と同値（LikeButton / RelatedPosts のキー用）
  number: number;      // 記事連番
  slug: string;
  title: string;
  description: string;
  content: string;     // markdown本文をHTMLに変換済み
  image: string | null; // coverImage のエイリアス（既存コンポーネント互換）
  coverImage: string | null;
  tags: PostTag[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  featured: boolean;
  draft: boolean;
  location: string[];  // 複数ロケーション対応（例: ["uk", "china"]）
  metaTags: string[];
  author: null;        // Wisp互換フィールド（将来拡張用）
}

export interface Pagination {
  page: number;
  limit: number | "all";
  totalPages: number;
  nextPage: number | null;
  prevPage: number | null;
}

export interface GetPostsResult {
  posts: Post[];
  pagination: Pagination;
}

export interface GetPostResult {
  post: Post | null;
}

export interface GetRelatedPostsResult {
  posts: Post[];
}

export interface Tag {
  id: string;
  name: string;
}
