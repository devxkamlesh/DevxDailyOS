/**
 * Image Optimization Utilities (L008)
 * Lazy loading, responsive images, and optimization helpers
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  className?: string;
}

// ============================================================================
// IMAGE HELPERS
// ============================================================================

/**
 * Generate responsive image sizes string
 */
export function generateSizes(breakpoints: Record<string, string>): string {
  const entries = Object.entries(breakpoints);
  return entries
    .map(([breakpoint, size]) => `(max-width: ${breakpoint}) ${size}`)
    .join(', ');
}

/**
 * Common responsive sizes presets
 */
export const imageSizes = {
  // Full width on mobile, half on tablet, third on desktop
  responsive: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  
  // Card images
  card: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw',
  
  // Avatar sizes
  avatar: '48px',
  avatarLarge: '96px',
  
  // Thumbnail
  thumbnail: '(max-width: 640px) 50vw, 150px',
  
  // Hero images
  hero: '100vw',
  
  // Icon sizes
  icon: '24px',
  iconLarge: '48px',
};

/**
 * Generate blur placeholder data URL
 */
export function generateBlurPlaceholder(
  width: number = 10,
  height: number = 10,
  color: string = '#1a1a1a'
): string {
  // Create a simple SVG placeholder
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="${color}"/>
    </svg>
  `;
  
  const base64 = typeof btoa !== 'undefined' 
    ? btoa(svg) 
    : Buffer.from(svg).toString('base64');
    
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Calculate aspect ratio
 */
export function calculateAspectRatio(width: number, height: number): number {
  return width / height;
}

/**
 * Get dimensions maintaining aspect ratio
 */
export function getDimensionsWithAspectRatio(
  originalWidth: number,
  originalHeight: number,
  targetWidth?: number,
  targetHeight?: number
): ImageDimensions {
  const aspectRatio = originalWidth / originalHeight;
  
  if (targetWidth && !targetHeight) {
    return {
      width: targetWidth,
      height: Math.round(targetWidth / aspectRatio),
    };
  }
  
  if (targetHeight && !targetWidth) {
    return {
      width: Math.round(targetHeight * aspectRatio),
      height: targetHeight,
    };
  }
  
  if (targetWidth && targetHeight) {
    return { width: targetWidth, height: targetHeight };
  }
  
  return { width: originalWidth, height: originalHeight };
}

/**
 * Check if image URL is external
 */
export function isExternalImage(src: string): boolean {
  if (!src) return false;
  return src.startsWith('http://') || src.startsWith('https://');
}

/**
 * Get optimized image URL (for external images)
 */
export function getOptimizedImageUrl(
  src: string,
  options: { width?: number; quality?: number } = {}
): string {
  const { width, quality = 75 } = options;
  
  // If using Next.js Image optimization
  if (!isExternalImage(src)) {
    return src;
  }
  
  // For Supabase storage images
  if (src.includes('supabase.co/storage')) {
    const url = new URL(src);
    if (width) {
      url.searchParams.set('width', String(width));
    }
    url.searchParams.set('quality', String(quality));
    return url.toString();
  }
  
  return src;
}

/**
 * Preload critical images
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }
    
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Preload multiple images
 */
export async function preloadImages(srcs: string[]): Promise<void> {
  await Promise.all(srcs.map(preloadImage));
}

// ============================================================================
// LAZY LOADING
// ============================================================================

/**
 * Create intersection observer for lazy loading
 */
export function createLazyLoadObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') {
    return null;
  }
  
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  };
  
  return new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(entry);
      }
    });
  }, defaultOptions);
}

// ============================================================================
// REACT HOOKS
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook for lazy loading images
 */
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!src) return;

    const observer = createLazyLoadObserver((entry) => {
      if (entry.isIntersecting) {
        const img = new Image();
        img.onload = () => {
          setImageSrc(src);
          setIsLoaded(true);
        };
        img.onerror = () => {
          setError(new Error('Failed to load image'));
        };
        img.src = src;
        
        observer?.unobserve(entry.target);
      }
    });

    if (imgRef.current && observer) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer?.disconnect();
    };
  }, [src]);

  return { imageSrc, isLoaded, error, imgRef };
}

/**
 * Hook for responsive image loading
 */
export function useResponsiveImage(
  srcSet: Record<number, string>,
  defaultSrc: string
) {
  const [currentSrc, setCurrentSrc] = useState(defaultSrc);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateSrc = () => {
      const width = window.innerWidth;
      const breakpoints = Object.keys(srcSet)
        .map(Number)
        .sort((a, b) => a - b);
      
      for (const breakpoint of breakpoints) {
        if (width <= breakpoint) {
          setCurrentSrc(srcSet[breakpoint]);
          return;
        }
      }
      
      // Use largest if no breakpoint matches
      const largest = breakpoints[breakpoints.length - 1];
      setCurrentSrc(srcSet[largest] || defaultSrc);
    };

    updateSrc();
    window.addEventListener('resize', updateSrc);
    
    return () => window.removeEventListener('resize', updateSrc);
  }, [srcSet, defaultSrc]);

  return currentSrc;
}

/**
 * Hook for image loading state
 */
export function useImageLoaded(src: string) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!src) return;

    setIsLoaded(false);
    setError(null);

    const img = new Image();
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setError(new Error('Failed to load image'));
    img.src = src;
  }, [src]);

  return { isLoaded, error };
}

/**
 * Hook for progressive image loading
 */
export function useProgressiveImage(lowQualitySrc: string, highQualitySrc: string) {
  const [src, setSrc] = useState(lowQualitySrc);
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setSrc(highQualitySrc);
      setIsHighQualityLoaded(true);
    };
    img.src = highQualitySrc;
  }, [highQualitySrc]);

  return { src, isHighQualityLoaded };
}

export default {
  generateSizes,
  imageSizes,
  generateBlurPlaceholder,
  getOptimizedImageUrl,
  preloadImage,
  preloadImages,
};
