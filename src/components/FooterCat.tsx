import { FunctionComponent } from "react";

type Variant = "static" | "ears" | "blink" | "wiggle";

type Props = {
  /** アニメーションの種類（フッターでの好みに合わせて切替） */
  variant?: Variant;
  className?: string;
  /** 1辺のサイズ(px) */
  size?: number;
};

/**
 * ミニマルな猫マーク（起きてる版）。
 * benji.org のフッター猫の雰囲気を参考に、線は currentColor の細線で統一。
 * 三角の耳・点の目・三本の髭（( ) の枠に少しかかる）・口なし。
 *
 * 色は親の text 色を継承するので、フッターでは text-muted-foreground 等を当てる。
 */
export const FooterCat: FunctionComponent<Props> = ({
  variant = "ears",
  className,
  size = 32,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
      className={className}
      aria-hidden
    >
      <style>{`
        .cat * { transform-box: fill-box; }
        /* 耳がときどきピクッと動く */
        @keyframes catEarL { 0%,86%,100%{transform:rotate(0)} 90%{transform:rotate(-10deg)} 94%{transform:rotate(-4deg)} }
        @keyframes catEarR { 0%,86%,100%{transform:rotate(0)} 90%{transform:rotate(10deg)} 94%{transform:rotate(4deg)} }
        .cat-ears .cat-ear-l { transform-origin:bottom center; animation:catEarL 6s ease-in-out infinite; }
        .cat-ears .cat-ear-r { transform-origin:bottom center; animation:catEarR 6s ease-in-out infinite; }
        /* ときどき瞬きする（点目が一瞬つぶれる） */
        @keyframes catBlink { 0%,94%,100%{transform:scaleY(1)} 97%{transform:scaleY(0.15)} }
        .cat-blink .cat-eye { transform-origin:center; animation:catBlink 4.5s ease-in-out infinite; }
        /* 頭をふるっと小さく傾ける */
        @keyframes catWiggle { 0%,90%,100%{transform:rotate(0)} 93%{transform:rotate(-3deg)} 96%{transform:rotate(3deg)} }
        .cat-wiggle .cat-head { transform-origin:center; animation:catWiggle 7s ease-in-out infinite; }
      `}</style>

      <g
        className={
          "cat" +
          (variant === "ears"
            ? " cat-ears"
            : variant === "blink"
              ? " cat-blink"
              : variant === "wiggle"
                ? " cat-wiggle"
                : "")
        }
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <g className="cat-head">
          {/* 三角の耳（低め・間隔をさらにつめる） */}
          <polyline className="cat-ear-l" points="12,12.5 14,9.9 16,12.3" />
          <polyline className="cat-ear-r" points="24,12.3 26,9.9 28,12.5" />

          {/* 顔の枠 ( )（さらに小さく） */}
          <path d="M14.5 16.5 Q11 20 14.5 23.5" />
          <path d="M25.5 16.5 Q29 20 25.5 23.5" />

          {/* 点の目（間隔を広げ、( ) からも少し離す） */}
          <circle className="cat-eye" cx="16.5" cy="20" r="1.4" fill="currentColor" stroke="none" />
          <circle className="cat-eye" cx="23.5" cy="20" r="1.4" fill="currentColor" stroke="none" />
        </g>

        {/* 三本の髭（全体を小さく・( ) に少しかかる） */}
        <path d="M10 18.7 L13 19" />
        <path d="M9.6 21 L13 21" />
        <path d="M10 23.3 L13 23" />
        <path d="M30 18.7 L27 19" />
        <path d="M30.4 21 L27 21" />
        <path d="M30 23.3 L27 23" />
      </g>
    </svg>
  );
};
