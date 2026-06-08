/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 既存記事は public/images をローカル配信。CMS の新規アップロードは Vercel Blob。
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  redirects: async () => {
    return [];
  },
};

export default nextConfig;
