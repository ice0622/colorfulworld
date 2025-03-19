"use client";
import { useState } from 'react';
import sanitize, { defaults } from "sanitize-html";
import ImageHighright from "./ImageHighright";
import { motion } from "framer-motion";
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { ContentWithCustomComponents } from "@wisp-cms/react-custom-component";
import SpotifyPlayer from "./SpotifyPlayer";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

interface Image {
  src: string;
  alt?: string;
}

export const PostContent = ({ content }: { content: string }) => {
  const [showSlider, setShowSlider] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<Image[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const sanitizedContent = sanitize(content, {
    allowedTags: [
      "b",
      "br",
      "i",
      "em",
      "strong",
      "a",
      "img",
      "h1",
      "h2",
      "h3",
      "code",
      "pre",
      "p",
      "li",
      "ul",
      "ol",
      "blockquote",
      // tables
      "td",
      "th",
      "table",
      "tr",
      "tbody",
      "thead",
      "tfoot",
      "small",
      "div",
      "iframe",
    ],
    allowedAttributes: {
      ...defaults.allowedAttributes,
      "*": ["style"],
      iframe: ["src", "allowfullscreen", "style"],
      div: [
        "data-name",
        "data-wisp-react-component",
        "data-version",
        "data-props",
      ],
      // カスタムコンポーネントの属性を追加
      SpotifyPlayer: ["playlistId", "width", "height"],
    },
    allowedIframeHostnames: ["www.youtube.com", "www.youtube-nocookie.com", "open.spotify.com"], // Spotify iframeを許可
  });

  const parser = new DOMParser();
  const doc = parser.parseFromString(sanitizedContent, 'text/html');
  const contentBlocks = Array.from(doc.body.childNodes);

  const images = contentBlocks
    .filter((block): block is HTMLImageElement => block.nodeName === 'IMG')
    .map(block => ({
      src: block.getAttribute('src') || '',
      alt: block.getAttribute('alt') || undefined
    }));

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxImages(images);
    setLightboxOpen(true);
  };

  const hasCustomComponents = content.includes('<div data-wisp-react-component="true"');

  return (
    <div className="blog-content mx-auto">
      {/* カスタムコンポーネントのみ中央配置 */}
      {hasCustomComponents && (
        <div className="flex justify-center items-center">
          <div className="space-y-6">
            <ContentWithCustomComponents
              content={content}
              customComponents={{
                SpotifyPlayer: (props: any) => (
                  <SpotifyPlayer {...props} width="100%" height="400" />
                ),
                // 他のカスタムコンポーネントもここに追加できます
              }}
            />
          </div>
        </div>
      )}

      {/* 他のコンテンツはそのまま表示 */}
      {!hasCustomComponents && (
        <div className="space-y-6">
          {contentBlocks.map((block, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="prose lg:prose-xl dark:prose-invert mx-auto"
            >
              {block.nodeType === Node.ELEMENT_NODE ? (
                (block as Element).nodeName === "IMG" ? (
                  <img
                    src={(block as Element).getAttribute("src") || undefined}
                    alt={(block as Element).getAttribute("alt") || undefined}
                    onClick={() =>
                      handleImageClick(
                        images.findIndex(
                          (img) => img.src === (block as Element).getAttribute("src")
                        )
                      )
                    }
                    className="cursor-pointer"
                  />
                ) : (
                  <div
                    dangerouslySetInnerHTML={{ __html: (block as Element).outerHTML }}
                  />
                )
              ) : (
                <p>{block.textContent}</p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* ボタンと画像スライダー、Lightbox は共通 */}
      <div className="flex justify-center mt-4">
        <button
          className="p-2 bg-white text-black border border-black rounded hover:bg-black hover:text-white transition-colors duration-300"
          onClick={() => setShowSlider(!showSlider)}
        >
          {showSlider ? "閉じる" : "ハイライト"}
        </button>
      </div>
      {showSlider && <ImageHighright content={sanitizedContent} />}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={lightboxImages}
        index={currentImageIndex}
      />
    </div>
  );
