import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
}

const useIntersectionObserver = (options?: IntersectionObserverInit) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.01,
        rootMargin: '100px',
        ...options,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return [ref, isIntersecting] as const;
};

export const LazyImage = ({ 
  src, 
  alt, 
  className, 
  placeholderClassName,
  ...props 
}: LazyImageProps) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageRef, isIntersecting] = useIntersectionObserver({
    threshold: 0.01,
    rootMargin: '100px',
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isIntersecting && src && !hasError) {
      // Create image object to preload
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      img.onerror = () => {
        setHasError(true);
      };
    }
  }, [isIntersecting, src, hasError]);

  return (
    <div 
      ref={imageRef} 
      className={cn("relative overflow-hidden", className)}
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: '200px 300px',
      }}
    >
      {/* Blurred placeholder */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-br from-muted/20 to-muted/40",
          "backdrop-blur-xl transition-opacity duration-500",
          placeholderClassName,
          isLoaded ? "opacity-0" : "opacity-100"
        )}
      />
      
      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
          <div className="text-muted-foreground text-sm">Failed to load</div>
        </div>
      )}
      
      {/* Actual image */}
      {imageSrc && !hasError && (
        <img
          src={imageSrc}
          alt={alt}
          className={cn(
            "w-full h-full object-cover",
            "transition-all duration-500 ease-out",
            "transform-gpu will-change-transform",
            isLoaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-105 blur-sm"
          )}
          loading="lazy"
          decoding="async"
          {...props}
        />
      )}
    </div>
  );
};