import { useState, useEffect} from 'react';
import { fixImageUrl } from '../../utils/urlUtils';

interface CustomImageProps {
  src: string | null;
  alt: string;
  className?: string;
  fallback?: string;
  style?: React.CSSProperties;
}

const CustomImage = ({ src, alt, className, fallback = '/placeholder-image.jpg' }: CustomImageProps) => {
  const [imageSrc, setImageSrc] = useState(fallback);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (src) {
      setImageSrc(fixImageUrl(src));
      setHasError(false);
    } else {
      setImageSrc(fallback);
    }
  }, [src]);

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