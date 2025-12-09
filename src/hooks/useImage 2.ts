import { useState, useEffect, useCallback } from 'react';

interface UseImageProps {
  src?: string | null;
  fallbackSrc: string;
}

interface UseImageReturn {
  imageSrc: string;
  isLoading: boolean;
  hasError: boolean;
  handleError: () => void;
  handleLoad: () => void;
}

export const useImage = ({ src, fallbackSrc }: UseImageProps): UseImageReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>(fallbackSrc);

  // Check if src is valid
  const isValidSrc = src && 
                   src.trim() !== '' && 
                   src !== 'null' && 
                   src !== 'undefined' &&
                   !hasError;

  useEffect(() => {
    if (isValidSrc) {
      setImageSrc(src);
      setIsLoading(true);
      setHasError(false);
    } else {
      setImageSrc(fallbackSrc);
      setIsLoading(false);
      setHasError(false);
    }
  }, [src, fallbackSrc, isValidSrc]);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    setImageSrc(fallbackSrc);
  }, [fallbackSrc]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  return {
    imageSrc,
    isLoading,
    hasError,
    handleError,
    handleLoad
  };
};
