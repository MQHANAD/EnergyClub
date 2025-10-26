import React from 'react';
import { useImage } from '@/hooks/useImage';

interface OptimizedImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackText?: string;
  size?: number;
  loading?: 'lazy' | 'eager';
  onError?: () => void;
  onLoad?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  fallbackText,
  size = 150,
  loading = 'lazy',
  onError,
  onLoad
}) => {
  // Generate initials for placeholder
  const getInitials = (text: string) => {
    return text.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const defaultImage = fallbackText 
    ? `https://via.placeholder.com/${size}/4F46E5/FFFFFF?text=${getInitials(fallbackText)}`
    : `https://via.placeholder.com/${size}/4F46E5/FFFFFF?text=IMG`;

  // Use custom image hook for better handling
  const { imageSrc, isLoading, hasError, handleError, handleLoad } = useImage({
    src,
    fallbackSrc: defaultImage
  });

  const handleImageError = () => {
    handleError();
    onError?.();
  };

  const handleImageLoad = () => {
    handleLoad();
    onLoad?.();
  };

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={`${className} ${isLoading ? 'opacity-50' : 'opacity-100'} transition-opacity duration-200`}
      onError={handleImageError}
      onLoad={handleImageLoad}
      loading={loading}
    />
  );
};
