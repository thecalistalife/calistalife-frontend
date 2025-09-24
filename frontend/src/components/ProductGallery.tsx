import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface ProductGalleryProps {
  images: string[];
  alt: string;
}

export const ProductGallery = ({ images, alt }: ProductGalleryProps) => {
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const constraintsRef = useRef(null);

  const safeSrc = (src: string, fallback: string) => src || fallback;

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = `https://via.placeholder.com/1000x1000?text=${encodeURIComponent(alt)}`;
  };

  return (
    <div className="relative" ref={constraintsRef}>
      {/* Main image with drag (swipe) */}
      <motion.div className="mb-4 overflow-hidden rounded-lg" drag="x" dragConstraints={constraintsRef} dragElastic={0.2} onDragEnd={(_, info) => {
        if (info.offset.x < -50) setIndex((i) => Math.min(i + 1, images.length - 1));
        if (info.offset.x > 50) setIndex((i) => Math.max(i - 1, 0));
      }}>
        <motion.img
          key={index}
          src={safeSrc(images[index], images[0])}
          alt={alt}
          onError={handleError}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: zoomed ? 1.2 : 1 }}
          transition={{ duration: 0.3 }}
          className={"w-full h-96 lg:h-[600px] object-cover cursor-zoom-in " + (zoomed ? 'cursor-zoom-out' : '')}
          onClick={() => setZoomed((z) => !z)}
        />
      </motion.div>

      {/* Thumbnails */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {images.map((img, i) => (
          <button key={i} onClick={() => setIndex(i)} className={"w-20 h-20 rounded-lg overflow-hidden border-2 " + (index === i ? 'border-black' : 'border-transparent hover:border-gray-300') }>
            <img src={img} alt="" className="w-full h-full object-cover" onError={handleError} />
          </button>
        ))}
      </div>
    </div>
  );
};