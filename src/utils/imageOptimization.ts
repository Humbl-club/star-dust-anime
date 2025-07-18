import { useEffect, useRef, useState, useCallback } from 'react';
import React from 'react';

/**
 * Image lazy loading utility using Intersection Observer
 */
export const useImageLazyLoading = (threshold = 0.1) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  return {
    imgRef,
    isLoaded,
    isInView,
    handleLoad,
    shouldLoad: isInView
  };
};

/**
 * Optimized image component with lazy loading and blur-up effect
 */
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  className = '',
  onLoad,
  ...props
}) => {
  const { imgRef, isLoaded, shouldLoad, handleLoad } = useImageLazyLoading();
  
  return React.createElement(
    'div',
    { className: `relative overflow-hidden ${className}` },
    // Placeholder/blur background
    !isLoaded && placeholder && React.createElement('img', {
      src: placeholder,
      alt: '',
      className: 'absolute inset-0 w-full h-full object-cover filter blur-sm scale-110'
    }),
    // Main image
    React.createElement('img', {
      ref: imgRef,
      src: shouldLoad ? src : undefined,
      alt,
      loading: 'lazy',
      className: `w-full h-full object-cover transition-opacity duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      }`,
      onLoad: (e: React.SyntheticEvent<HTMLImageElement>) => {
        handleLoad();
        onLoad?.(e);
      },
      ...props
    }),
    // Loading overlay
    !isLoaded && shouldLoad && React.createElement('div', {
      className: 'absolute inset-0 bg-muted-foreground/10 animate-pulse'
    })
  );
};