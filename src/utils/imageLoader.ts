import React from 'react';
import { warn, error as logError } from './logger';

export const loadFirebaseImage = async (url: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => resolve(url);
    img.onerror = () => {
      warn('Failed to load Firebase image', { url });
      fetch(url, { mode: 'cors', credentials: 'omit' })
        .then(response => response.blob())
        .then(blob => resolve(URL.createObjectURL(blob)))
        .catch(err => {
          logError('Image load failed', err, { url });
          resolve(url);
        });
    };
    
    img.src = url;
  });
};

export const useFirebaseImage = (url: string | undefined) => {
  const [imageUrl, setImageUrl] = React.useState<string | undefined>(url);
  const [loading, setLoading] = React.useState(!!url);
  const [error, setError] = React.useState<Error | null>(null);
  
  React.useEffect(() => {
    if (!url) {
      setImageUrl(undefined);
      setLoading(false);
      return;
    }
    
    if (url.includes('firebasestorage.googleapis.com')) {
      setLoading(true);
      setError(null);
      
      loadFirebaseImage(url)
        .then(loadedUrl => {
          setImageUrl(loadedUrl);
          setLoading(false);
        })
        .catch(err => {
          setError(err);
          setImageUrl(url);
          setLoading(false);
        });
    } else {
      setImageUrl(url);
      setLoading(false);
    }
  }, [url]);
  
  return { imageUrl, loading, error };
};

interface FirebaseImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  fallback?: string;
}

export const FirebaseImage: React.FC<FirebaseImageProps> = ({ 
  src, 
  fallback = '/placeholder-image.png',
  ...props 
}) => {
  const { imageUrl, loading } = useFirebaseImage(src);
  
  if (loading) {
    return React.createElement('div', {
      className: 'animate-pulse bg-gray-200 rounded',
      style: { width: props.width || '100%', height: props.height || '200px' }
    });
  }
  
  return React.createElement('img', {
    ...props,
    src: imageUrl || fallback,
    crossOrigin: 'anonymous',
    onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
      const target = e.target as HTMLImageElement;
      if (target.src !== fallback) {
        target.src = fallback;
      }
      props.onError?.(e);
    }
  });
};