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
  {
    slug: "france",
    name: "フランス",
    lat: 48.8566,
    lng: 2.3522,
    size: 0.07,
  },
  {
    slug: "uk",
    name: "イギリス",
    lat: 51.5074,
    lng: -0.1278,
    size: 0.07,
  },
  {
    slug: "china",
    name: "中国",
    lat: 39.9042,
    lng: 116.4074,
    size: 0.07,
  },
  {
    slug: "korea",
    name: "韓国",
    lat: 37.5665,
    lng: 126.9780,
    size: 0.07,
  },
];
