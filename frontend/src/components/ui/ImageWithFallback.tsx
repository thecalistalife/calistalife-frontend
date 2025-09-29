import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { ImageIcon, AlertCircle } from 'lucide-react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  onError?: (error: Event) => void;
  showErrorState?: boolean;
  errorMessage?: string;
}

export interface ImageWithFallbackRef {
  retry: () => void;
}

const ImageWithFallback = forwardRef<ImageWithFallbackRef, ImageWithFallbackProps>(({
  src,
  alt,
  fallbackSrc,
  className = '',
  onError,
  showErrorState = true,
  errorMessage = 'Image not available',
  ...props
}, ref) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const MAX_RETRIES = 2;

  // Generate fallback URLs based on the original URL
  const generateFallbackUrls = (originalSrc: string): string[] => {
    const fallbacks: string[] = [];
    
    // If custom fallback provided
    if (fallbackSrc) {
      fallbacks.push(fallbackSrc);
    }

    // For Unsplash URLs, try different parameters
    if (originalSrc.includes('unsplash.com')) {
      const urlObj = new URL(originalSrc);
      
      // Try without crop parameters
      const baseUrl = `${urlObj.origin}${urlObj.pathname}`;
      fallbacks.push(`${baseUrl}?w=600&h=600&fit=crop`);
      fallbacks.push(`${baseUrl}?w=600&h=600`);
      fallbacks.push(`${baseUrl}?auto=format&fit=crop&w=600&h=600`);
      
      // Try alternative Unsplash endpoints
      const photoId = urlObj.pathname.split('/').pop();
      if (photoId) {
        fallbacks.push(`https://source.unsplash.com/${photoId}/600x600`);
        fallbacks.push(`https://picsum.photos/id/${Math.abs(photoId.hashCode() % 1000)}/600/600`);
      }
    }

    // Generic fallbacks
    fallbacks.push('https://via.placeholder.com/600x600/f0f0f0/666666?text=No+Image');
    fallbacks.push('/api/placeholder/600/600');

    return [...new Set(fallbacks)]; // Remove duplicates
  };

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const fallbacks = generateFallbackUrls(src);
    
    if (retryCount < fallbacks.length - 1) {
      setRetryCount(prev => prev + 1);
      setCurrentSrc(fallbacks[retryCount + 1]);
    } else {
      setHasError(true);
      setIsLoading(false);
    }

    if (onError) {
      onError(event.nativeEvent);
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const retry = () => {
    setHasError(false);
    setIsLoading(true);
    setRetryCount(0);
    setCurrentSrc(src);
  };

  useImperativeHandle(ref, () => ({
    retry
  }));

  // Loading state
  if (isLoading && !hasError) {
    return (
      <div 
        className={`bg-gray-100 animate-pulse flex items-center justify-center ${className}`}
        style={{ minHeight: '200px' }}
      >
        <ImageIcon className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  // Error state
  if (hasError && showErrorState) {
    return (
      <div 
        className={`bg-gray-100 flex flex-col items-center justify-center p-4 ${className}`}
        style={{ minHeight: '200px' }}
      >
        <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
        <span className="text-sm text-gray-500 text-center mb-2">{errorMessage}</span>
        <button
          onClick={retry}
          className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleImageError}
      onLoad={handleImageLoad}
      {...props}
    />
  );
});

ImageWithFallback.displayName = 'ImageWithFallback';

export default ImageWithFallback;

// Helper extension for string hashing (for generating fallback IDs)
declare global {
  interface String {
    hashCode(): number;
  }
}

String.prototype.hashCode = function() {
  let hash = 0;
  if (this.length === 0) return hash;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
};