import { FunctionComponent } from "react";

type Variant = "lying" | "curled";

type Props = {
  className?: string;
  /** 体勢：伸びて寝てる(lying) / 丸まって寝てる(curled) */
  variant?: Variant;
  /** 高さ(px)。横幅は variant に応じて自動 */
  size?: number;
  /** z の浮遊アニメをつけるか */
  animated?: boolean;
};

const Z_ANIM = `
  @keyframes catZ1 { 0%{opacity:0;transform:translate(0,0) scale(.7)} 15%{opacity:1} 75%{opacity:1} 100%{opacity:0;transform:translate(3px,-7px) scale(1)} }
  @keyframes catZ2 { 0%{opacity:0;transform:translate(0,0) scale(.6)} 15%{opacity:1} 75%{opacity:1} 100%{opacity:0;transform:translate(4px,-8px) scale(.9)} }
  .scat-z { transform-box: fill-box; }
  .scat-anim .scat-z1 { animation: catZ1 3.6s ease-in-out infinite; }
  .scat-anim .scat-z2 { animation: catZ2 3.6s ease-in-out .5s infinite; }
`;

/**
 * 寝ている猫（ミニマル）。currentColor の細線で、起きてる版 FooterCat と同じテイスト。
 * - lying : 細めの体を少し斜めに伸ばして伏せている
 * - curled: 体を丸めて寝ている
 */
export const SleepingCat: FunctionComponent<Props> = ({
  className,
  variant = "lying",
  size = 28,
  animated = true,
}) => {
  const curled = variant === "curled";
  const vb = curled ? "0 0 44 40" : "0 0 48 32";
  const width = Math.round(size * (curled ? 1.1 : 1.5));

  return (
    <svg
      width={width}
      height={size}
      viewBox={vb}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
      className={className}
      aria-hidden
    >
      <style>{Z_ANIM}</style>

      <g
        className={animated ? "scat-anim" : undefined}
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {curled ? (
          <>
            {/* 体を少し斜めに */}
            <g transform="rotate(-8 20 21)">
              {/* 丸めた胴体（頭は左下） */}
              <path d="M15 27 C9 24 9 14 18 12.5 C26 11 32 15 32 22 C32 29 25 32 18 30 C16 29.4 15.5 28 15 27 Z" />
              {/* 三角の耳（頭側＝左下） */}
              <polyline points="13.5,24.5 13.5,21.5 16,23.2" />
              <polyline points="16,23.2 17.5,20.8 19.5,23.4" />
              {/* 閉じ目 */}
              <path d="M14.6 25 q1.3 0.8 2.5 0" />
              {/* 前足 */}
              <path d="M15.6 27.6 q2 0.6 3.8 -0.2" />
              {/* しっぽ（おしり側からくるり） */}
              <path d="M30 29 C26 33 18 34 13.5 30.5 C11.5 29 12 27.6 13.6 27.6" />
            </g>
            {/* 浮かぶ z */}
            <path className="scat-z scat-z1" d="M33 12 h2 l-2 2 h2" />
            <path className="scat-z scat-z2" d="M36.6 7.5 h2.6 l-2.6 2.6 h2.6" />
          </>
        ) : (
          <>
            {/* 体を少し斜めに */}
            <g transform="rotate(-9 24 21)">
              {/* 細めの胴体（伸びて伏せている） */}
              <path d="M9 25 C12 19 23 18 31 19.5 C35 20 37.5 19.5 39 21.5 C40.2 23 38.5 24.6 37 24.2 C28 25.7 16 26 10.5 25.6 C9 25.5 8.2 25.6 9 25 Z" />
              {/* 三角の耳（頭側＝右） */}
              <polyline points="32,19 33.2,16.6 35,19.2" />
              <polyline points="35,19.2 36.6,16.6 38,19.6" />
              {/* 閉じ目 */}
              <path d="M35 21.5 q1.2 0.9 2.4 0" />
              {/* しっぽ */}
              <path d="M9 25 C4 24 3 18 8 17 C10.6 16.6 11 18.8 9.8 19.8" />
            </g>
            {/* 浮かぶ z */}
            <path className="scat-z scat-z1" d="M40 14 h2.2 l-2.2 2.2 h2.2" />
            <path className="scat-z scat-z2" d="M43.6 9 h2.8 l-2.8 2.8 h2.8" />
          </>
        )}
      </g>
    </svg>
  );
};
