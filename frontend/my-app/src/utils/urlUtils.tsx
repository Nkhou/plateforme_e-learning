export const fixImageUrl = (url: string): string => {
  if (!url) return '/placeholder-image.jpg';
  
  // If it's already a full URL with backend, replace with localhost
  if (url.includes('backend:8000')) {
    return url.replace('backend:8000', 'localhost:8000');
  }
  
  // If it's a relative path, make it absolute
  if (url.startsWith('/') && !url.startsWith('//')) {
    return `http://localhost:8000${url}`;
  }
  
  return url;
};

export const isAbsoluteUrl = (url: string): boolean => {
  return url.startsWith('http://') || url.startsWith('https://');
};