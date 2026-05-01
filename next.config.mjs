/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 現在は public/images 配下をローカルで配信
    // 将来 CDN を導入する際はここに remotePatterns を追加する
    // 例: { protocol: "https", hostname: "cdn.colorfulworld.jp" }
    remotePatterns: [],
  },
  redirects: async () => {
    return [];
  },
};

export default nextConfig;
