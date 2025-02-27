"use client";
import { useState } from 'react';
import sanitize, { defaults } from "sanitize-html";
import ImageHighright from "./ImageHighright";
import { motion } from "framer-motion";
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export const PostContent = ({ content }: { content: string }) => {
  const [showSlider, setShowSlider] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);
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
    },
    allowedIframeHostnames: ["www.youtube.com", "www.youtube-nocookie.com"],
  });

  const parser = new DOMParser();
  const doc = parser.parseFromString(sanitizedContent, 'text/html');
  const contentBlocks = Array.from(doc.body.childNodes);

  const images = contentBlocks
    .filter(block => block.nodeName === 'IMG')
    .map(block => ({
      src: block.getAttribute('src'),
      alt: block.getAttribute('alt')
    }));

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxImages(images);
    setLightboxOpen(true);
  };

  return (
    <div className="blog-content mx-auto">
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
              block.nodeName === 'IMG' ? (
                <img
                  src={block.getAttribute('src')}
                  alt={block.getAttribute('alt')}
                  onClick={() => handleImageClick(images.findIndex(img => img.src === block.getAttribute('src')))}
                  className="cursor-pointer"
                />
              ) : (
                <div dangerouslySetInnerHTML={{ __html: block.outerHTML }} />
              )
            ) : (
              <p>{block.textContent}</p>
            )}
          </motion.div>
        ))}
      </div>
      <div className="flex justify-center mt-4">
        <button
          className="p-2 bg-white text-black border border-black rounded hover:bg-black hover:text-white transition-colors duration-300"
          onClick={() => setShowSlider(!showSlider)}
        >
          {showSlider ? '閉じる' : 'ハイライト'}
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
};