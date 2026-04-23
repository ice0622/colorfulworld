export type PostLocation = {
  // URLや内部識別子（小文字英数字）。frontmatter の location フィールドと一致させる
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
    size: 0.02,
  },
  {
    slug: "france",
    name: "フランス",
    lat: 48.8566,
    lng: 2.3522,
    size: 0.02,
  },
  {
    slug: "manchester",
    name: "マンチェスター",
    lat: 53.4808,
    lng: -2.2426,
    size: 0.02,
  },
  {
    slug: "liverpool",
    name: "リバプール",
    lat: 53.4084,
    lng: -2.9916,
    size: 0.02,
  },
  {
    slug: "uk",
    name: "ロンドン",
    lat: 51.5074,
    lng: -0.1278,
    size: 0.02,
  },
  {
    slug: "china",
    name: "中国",
    lat: 31.2304,
    lng: 121.4737,
    size: 0.02,
  },
];
