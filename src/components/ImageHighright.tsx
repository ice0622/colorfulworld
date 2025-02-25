import { useEffect, useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

interface Props {
  content: string;
}

const ImageHighright = ({ content }: Props) => {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const regex = /<img src="([^"]+)"/g;
    const imageUrls: string[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      imageUrls.push(match[1]);
    }
    setImages(imageUrls);
  }, [content]);

  const handleImageClick = (index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
  };

  return (
    <div className="relative w-full">
      <div className="grid grid-cols-3 gap-4">
        {images.map((src, index) => (
          <div key={index} className="w-full">
            <img
              src={src}
              alt={`Image ${index}`}
              className="w-full h-auto cursor-pointer hover:opacity-75"
              onClick={() => handleImageClick(index)}
            />
          </div>
        ))}
      </div>

      {/* Lightbox for image preview */}
      {isOpen && (
        <Lightbox
          open={isOpen}
          close={() => setIsOpen(false)}
          slides={images.map((src) => ({ src }))}
          index={currentIndex}
        />
      )}
    </div>
  );
};

export default ImageHighright;