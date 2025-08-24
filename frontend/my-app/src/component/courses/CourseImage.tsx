// src/component/courses/CourseImage.tsx
import React, { useState, useEffect } from 'react';

interface CourseImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc: string;
  style?: React.CSSProperties;
}

const CourseImage: React.FC<CourseImageProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc,
  style = {},
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState<string>(src);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      setImgSrc(fallbackSrc);
      setHasError(true);
    }
  };

  // Fix image URL to properly point to backend server
  const getFixedImageUrl = (url: string): string => {
    if (!url) return fallbackSrc;

    // If it's already a full URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // If it's a relative path starting with /media, prepend backend URL
    if (url.startsWith('/media/') || url.startsWith('media/')) {
      // Use import.meta.env for Vite instead of process.env
      const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const cleanUrl = url.startsWith('/') ? url : `/${url}`;
      return `${backendUrl}${cleanUrl}`;
    }

    // For relative paths, assume they're from the backend
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    return `${backendUrl}/media/course_images/${url}`;
  };

  return (
    <img
      src={getFixedImageUrl(imgSrc)}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
      {...props}
    />
  );
};

export default CourseImage;