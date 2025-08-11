import React, { useState, useRef, useEffect } from 'react';
import { info, warn } from '@/utils/logger';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  blurDataURL?: string;
  sizes?: string;
  priority?: boolean;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder,
  loading = 'lazy',
  onLoad,
  onError,
  fallbackSrc,
  blurDataURL,
  sizes,
  priority = false
}) => {
  const [imageSrc, setImageSrc] = useState<string>(
    priority ? src : placeholder || blurDataURL || ''
  );
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // If priority loading, load immediately
    if (priority) {
      loadImage();
      return;
    }

    // Otherwise use intersection observer for lazy loading
    if ('IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadImage();
              if (observerRef.current && imageRef.current) {
                observerRef.current.unobserve(imageRef.current);
              }
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: '50px'
        }
      );

      if (imageRef.current) {
        observerRef.current.observe(imageRef.current);
      }
    } else {
      // Fallback for browsers without IntersectionObserver
      loadImage();
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src, priority]);

  const loadImage = () => {
    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setImageLoaded(true);
      setImageError(false);
      onLoad?.();
      
      info('Image loaded successfully', {
        component: 'LazyImage',
        src: src,
        alt: alt
      });
    };

    img.onerror = () => {
      setImageError(true);
      
      if (fallbackSrc) {
        setImageSrc(fallbackSrc);
        setImageLoaded(true);
      }
      
      onError?.();
      
      warn('Failed to load image', {
        component: 'LazyImage',
        src: src,
        alt: alt,
        fallbackUsed: !!fallbackSrc
      });
    };

    img.src = src;
    if (sizes) img.sizes = sizes;
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
    }
  };

  // Progressive enhancement: show placeholder while loading
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const imageStyle: React.CSSProperties = {
    transition: 'opacity 0.3s ease-in-out',
    opacity: imageLoaded ? 1 : 0,
  };

  const placeholderStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5e7eb',
    color: '#9ca3af',
    fontSize: '14px',
    opacity: imageLoaded ? 0 : 1,
    transition: 'opacity 0.3s ease-in-out',
    pointerEvents: 'none',
  };

  return (
    <div style={containerStyle} className={className}>
      {/* Main image */}
      <img
        ref={imageRef}
        src={imageSrc}
        alt={alt}
        loading={loading}
        style={imageStyle}
        onLoad={handleImageLoad}
        onError={handleImageError}
        sizes={sizes}
        className="w-full h-full object-cover"
      />
      
      {/* Placeholder/Loading state */}
      {!imageLoaded && !imageError && (
        <div style={placeholderStyle}>
          {placeholder ? (
            <img src={placeholder} alt="" className="w-full h-full object-cover opacity-50" />
          ) : blurDataURL ? (
            <img src={blurDataURL} alt="" className="w-full h-full object-cover blur-sm opacity-50" />
          ) : (
            <div className="text-center">
              <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Cargando imagen...</span>
            </div>
          )}
        </div>
      )}
      
      {/* Error state */}
      {imageError && !fallbackSrc && (
        <div style={placeholderStyle}>
          <div className="text-center">
            <svg className="w-8 h-8 mx-auto mb-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Error al cargar imagen</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Hook for batch image preloading
export const useImagePreloader = (urls: string[]) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const preloadImages = async () => {
      const promises = urls.map((url) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          
          img.onload = () => {
            setLoadedImages(prev => new Set(prev).add(url));
            resolve();
          };
          
          img.onerror = () => {
            setFailedImages(prev => new Set(prev).add(url));
            resolve();
          };
          
          img.src = url;
        });
      });

      await Promise.all(promises);
    };

    if (urls.length > 0) {
      preloadImages();
    }
  }, [urls]);

  return {
    loadedImages,
    failedImages,
    isLoaded: (url: string) => loadedImages.has(url),
    isFailed: (url: string) => failedImages.has(url),
    allLoaded: loadedImages.size + failedImages.size === urls.length
  };
};

export default LazyImage;