// Performance optimization utilities

// CSS optimization helpers
export const addCriticalCSS = () => {
  const criticalCSS = `
    /* Critical above-fold styles */
    body { 
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, hsl(220 26% 6%), hsl(220 20% 8%));
      color: hsl(210 40% 98%);
      margin: 0;
      overflow-x: hidden;
    }
    
    /* Hero section critical styles */
    .hero-section {
      min-height: 50vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, hsl(219 100% 65% / 0.1), hsl(270 95% 50% / 0.1));
    }
    
    /* Navigation critical styles */
    nav {
      position: fixed;
      top: 0;
      width: 100%;
      z-index: 50;
      background: hsl(220 20% 8% / 0.4);
      backdrop-filter: blur(20px);
    }
    
    /* Loading states */
    .loading-skeleton {
      background: linear-gradient(90deg, hsl(220 15% 15%) 25%, hsl(220 15% 20%) 50%, hsl(220 15% 15%) 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
    }
    
    @keyframes loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;

  const style = document.createElement('style');
  style.textContent = criticalCSS;
  document.head.appendChild(style);
};

// Preload critical resources
export const preloadCriticalResources = () => {
  const resources = [
    { href: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ.woff2', as: 'font', type: 'font/woff2' },
    { href: '/src/index.css', as: 'style' },
    { href: '/src/main.tsx', as: 'script' }
  ];

  resources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.href;
    link.as = resource.as;
    if (resource.type) link.type = resource.type;
    if (resource.as === 'font') link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};

// Image optimization helpers
export const optimizeImageLoading = () => {
  // Add fetchpriority to hero images
  const heroImages = document.querySelectorAll('[data-hero-image]');
  heroImages.forEach(img => {
    if (img instanceof HTMLImageElement) {
      img.fetchPriority = 'high';
    }
  });

  // Add loading lazy to below-fold images
  const images = document.querySelectorAll('img:not([data-hero-image])');
  images.forEach(img => {
    if (img instanceof HTMLImageElement && !img.loading) {
      img.loading = 'lazy';
    }
  });
};

// Animation performance optimizations
export const optimizeAnimations = () => {
  const animatedElements = document.querySelectorAll('.anime-card, .hover-scale, .spring-bounce');
  
  animatedElements.forEach(element => {
    if (element instanceof HTMLElement) {
      // Enable hardware acceleration
      element.style.willChange = 'transform';
      element.style.transform = 'translateZ(0)';
      
      // Remove will-change after animation to free up resources
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting && entry.target instanceof HTMLElement) {
            entry.target.style.willChange = 'auto';
          }
        });
      }, { threshold: 0 });
      
      observer.observe(element);
    }
  });
};

// Memory management
export const cleanupUnusedResources = () => {
  // Clear unused images from memory
  const images = document.querySelectorAll('img[data-cleanup]');
  images.forEach(img => {
    if (img instanceof HTMLImageElement) {
      img.src = '';
      img.remove();
    }
  });
  
  // Force garbage collection if available
  if ('gc' in window && typeof window.gc === 'function') {
    window.gc();
  }
};

// Network optimization
export const optimizeNetworkRequests = () => {
  // Preconnect to external domains
  const domains = [
    'https://axtpbgsjbmhbuqomarcr.supabase.co',
    'https://cdn.myanimelist.net',
    'https://s4.anilist.co'
  ];

  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    document.head.appendChild(link);
  });
};

// Bundle splitting helpers
export const shouldLazyLoad = (componentName: string): boolean => {
  const lazyComponents = [
    'Analytics',
    'Settings', 
    'EmailDebug',
    'AdvancedFiltering',
    'CuratedLists'
  ];
  
  return lazyComponents.includes(componentName);
};

// Performance monitoring setup
export const setupPerformanceObserver = () => {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          console.log('LCP:', entry.startTime);
        }
        
        if (entry.entryType === 'first-input') {
          const firstInput = entry as any;
          console.log('FID:', firstInput.processingStart - firstInput.startTime);
        }
        
        if (entry.entryType === 'layout-shift') {
          const layoutShift = entry as any;
          if (layoutShift.hadRecentInput === false) {
            console.log('CLS:', layoutShift.value);
          }
        }
      }
    });

    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
  }
};

// Initialize all optimizations
export const initializePerformanceOptimizations = () => {
  // Only run optimizations in production or when explicitly enabled
  if (import.meta.env.PROD || localStorage.getItem('enable-performance-optimizations') === 'true') {
    addCriticalCSS();
    preloadCriticalResources();
    optimizeNetworkRequests();
    setupPerformanceObserver();
    
    // Run after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        optimizeImageLoading();
        optimizeAnimations();
      });
    } else {
      optimizeImageLoading();
      optimizeAnimations();
    }
    
    // Cleanup periodically
    setInterval(cleanupUnusedResources, 5 * 60 * 1000); // Every 5 minutes
  }
};