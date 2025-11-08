export const lazyLoadImage = (imageSrc, placeholder = '/placeholder.jpg') => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => resolve(imageSrc);
    img.onerror = () => resolve(placeholder);
  });
};

// Intersection Observer for lazy loading
export const setupLazyLoading = () => {
  const images = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px 0px',
    threshold: 0.01
  });

  images.forEach(img => imageObserver.observe(img));
};
