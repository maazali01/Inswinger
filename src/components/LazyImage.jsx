import { useState, useEffect } from 'react';

export default function LazyImage({ src, alt, className, placeholder = '/placeholder.jpg' }) {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageRef, setImageRef] = useState(null);

  useEffect(() => {
    let observer;
    
    if (imageRef && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setImageSrc(src);
              observer.unobserve(imageRef);
            }
          });
        },
        {
          rootMargin: '50px',
        }
      );

      observer.observe(imageRef);
    } else {
      // Fallback for browsers without IntersectionObserver
      setImageSrc(src);
    }

    return () => {
      if (observer && observer.disconnect) {
        observer.disconnect();
      }
    };
  }, [imageRef, src]);

  return (
    <img
      ref={setImageRef}
      src={imageSrc}
      alt={alt}
      className={className}
      loading="lazy"
    />
  );
}
