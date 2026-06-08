import Image from "next/image";

// ---- 傾き設定（PolaroidCard と揃える）----
const MIN_TILT = 1; // 最小傾き（度）
const MAX_TILT = 3; // 最大傾き（度）
// -------------------------------------------

// slug から決定的な傾き角度を生成する（PolaroidCard.tsx と同一ロジック）
function getTiltAngle(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) | 0;
  }
  const sign = hash % 2 === 0 ? 1 : -1;
  const range = MAX_TILT - MIN_TILT;
  const magnitude = MIN_TILT + (Math.abs(hash) % (range + 1));
  return sign * magnitude;
}

type Props = {
  src: string | null;
  alt: string;
  /** 傾きを決定づけるキー（記事 slug） */
  seed: string;
  /** 内側画像の幅（Tailwind クラス）。用途に応じて差し替える */
  widthClass?: string;
};

/**
 * 横長のポラロイド風サムネ（静的）。白フチ＋影＋slug 由来の決定的な微傾き。
 * 表示・非表示やアニメーションは親側が制御する。
 * 表示は小さいが sizes / quality を上げて高解像度を取得しボケを防ぐ。
 */
export default function PolaroidThumb({ src, alt, seed, widthClass = "w-36" }: Props) {
  const tilt = getTiltAngle(seed);

  return (
    <div
      style={{ transform: `rotate(${tilt}deg)` }}
      className="bg-white p-1 pb-1.5 shadow-xl ring-1 ring-black/5"
    >
      <div className={`relative aspect-[4/3] ${widthClass} overflow-hidden bg-gray-100`}>
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            quality={90}
            className="object-cover"
            sizes="320px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-1 text-center text-[10px] leading-tight text-gray-400">
            {alt}
          </div>
        )}
      </div>
    </div>
  );
}
