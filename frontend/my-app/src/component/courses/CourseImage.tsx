import { useState } from 'react';
import { fixImageUrl } from '../../utils/urlUtils';

interface CustomImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  style?: React.CSSProperties;
}

const CustomImage = ({ src, alt, className, fallback = '/placeholder-image.jpg' }: CustomImageProps) => {
  const [imageSrc, setImageSrc] = useState(fixImageUrl(src));
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImageSrc(fallback);
    }
  };

  return (
    <img 
      src={imageSrc} 
      alt={alt} 
      className={className}
      onError={handleError}
    />
  );
};

export default CustomImage;