import React, { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'loading' | 'decoding'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  lazy?: boolean;
  webpSrc?: string;
  avifSrc?: string;
  placeholder?: string;
  blurDataURL?: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  lazy = true,
  webpSrc,
  avifSrc,
  placeholder,
  blurDataURL,
  priority = false,
  sizes,
  className = '',
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before the image comes into view
        threshold: 0.1,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, priority, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Generate srcSet for responsive images
  const generateSrcSet = (baseSrc: string) => {
    const extension = baseSrc.split('.').pop();
    const baseName = baseSrc.replace(`.${extension}`, '');
    
    return [
      `${baseName}_400w.${extension} 400w`,
      `${baseName}_800w.${extension} 800w`,
      `${baseName}_1200w.${extension} 1200w`,
      `${baseName}_1600w.${extension} 1600w`,
    ].join(', ');
  };

  // Default sizes if not provided
  const defaultSizes = sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Placeholder/blur image */}
      {(placeholder || blurDataURL) && !isLoaded && (
        <img
          src={placeholder || blurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
          style={{
            filter: blurDataURL ? 'blur(10px)' : 'none',
            transform: 'scale(1.1)', // Slightly scale to hide blur edges
          }}
          aria-hidden="true"
        />
      )}

      {/* Main image with next-gen format support */}
      {isInView && (
        <picture>
          {/* AVIF format (best compression) */}
          {avifSrc && (
            <source
              srcSet={avifSrc}
              type="image/avif"
              sizes={defaultSizes}
            />
          )}
          
          {/* WebP format (good compression, wide support) */}
          {webpSrc && (
            <source
              srcSet={webpSrc}
              type="image/webp"
              sizes={defaultSizes}
            />
          )}
          
          {/* Fallback JPEG/PNG */}
          <img
            src={src}
            srcSet={generateSrcSet(src)}
            alt={alt}
            width={width}
            height={height}
            sizes={defaultSizes}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className={`transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            } ${hasError ? 'hidden' : ''}`}
            onLoad={handleLoad}
            onError={handleError}
            {...props}
          />
        </picture>
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
            />
          </svg>
        </div>
      )}

      {/* Loading spinner for slow connections */}
      {isInView && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

// Hook for preloading critical images
export const useImagePreloader = (sources: string[]) => {
  useEffect(() => {
    sources.forEach((src) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  }, [sources]);
};

// Utility function to generate image URLs for different formats and sizes
export const generateImageSources = (
  basePath: string,
  filename: string,
  extension: string = 'jpg'
) => {
  const baseName = filename.replace(/\.[^/.]+$/, '');
  
  return {
    avif: `${basePath}/${baseName}.avif`,
    webp: `${basePath}/${baseName}.webp`,
    original: `${basePath}/${baseName}.${extension}`,
    placeholder: `${basePath}/${baseName}_placeholder.jpg`,
    sizes: {
      small: `${basePath}/${baseName}_400w.${extension}`,
      medium: `${basePath}/${baseName}_800w.${extension}`,
      large: `${basePath}/${baseName}_1200w.${extension}`,
      xlarge: `${basePath}/${baseName}_1600w.${extension}`,
    }
  };
};

export default OptimizedImage;