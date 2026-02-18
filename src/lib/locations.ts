export type PostLocation = {
  // Wisp CMS の記事スラッグと一致させる
  slug: string;
  // 地図上の表示名
  name: string;
  // 緯度
  lat: number;
  // 経度
  lng: number;
  // ピンの大きさ（0.03〜0.1 が目安）
  size: number;
};

export const POST_LOCATIONS: PostLocation[] = [
  {
    slug: "tokyo",
    name: "東京",
    lat: 35.6895,
    lng: 139.6917,
    size: 0.07,
  },
];
