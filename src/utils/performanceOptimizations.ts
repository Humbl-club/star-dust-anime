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

// Simplified performance monitoring - Web Vitals only
export const setupPerformanceObserver = () => {
  // Only run if monitoring is enabled
  if (!('PerformanceObserver' in window) || 
      (!import.meta.env.PROD && localStorage.getItem('enable-performance-monitoring') !== 'true')) {
    return;
  }

  // Import web-vitals for comprehensive monitoring
  import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
    onCLS((metric) => {
      if (!import.meta.env.PROD) console.log('CLS:', metric.value);
    });
    onINP((metric) => {
      if (!import.meta.env.PROD) console.log('INP:', metric.value);
    });
    onFCP((metric) => {
      if (!import.meta.env.PROD) console.log('FCP:', metric.value);
    });
    onLCP((metric) => {
      if (!import.meta.env.PROD) console.log('LCP:', metric.value);
    });
    onTTFB((metric) => {
      if (!import.meta.env.PROD) console.log('TTFB:', metric.value);
    });
  }).catch(() => {
    // Fallback if web-vitals not available
    console.warn('Web Vitals monitoring not available');
  });
};

// Clear performance observers
export const clearPerformanceObservers = () => {
  // Clear any running performance observers
  if ('PerformanceObserver' in window) {
    try {
      PerformanceObserver.supportedEntryTypes.forEach(type => {
        const observer = new PerformanceObserver(() => {});
        observer.disconnect();
      });
    } catch (error) {
      console.warn('Could not clear performance observers:', error);
    }
  }
};

// Initialize all optimizations
export const initializePerformanceOptimizations = () => {
  // Always run core optimizations (no overhead)
  addCriticalCSS();
  preloadCriticalResources();
  optimizeNetworkRequests();
  
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
  
  // Conditional monitoring and cleanup
  const monitoringEnabled = import.meta.env.PROD || localStorage.getItem('enable-performance-monitoring') === 'true';
  
  if (monitoringEnabled) {
    setupPerformanceObserver();
    
    // Cleanup periodically - 30 minutes in production, none in development
    if (import.meta.env.PROD) {
      setInterval(cleanupUnusedResources, 30 * 60 * 1000); // Every 30 minutes
    }
  }
};