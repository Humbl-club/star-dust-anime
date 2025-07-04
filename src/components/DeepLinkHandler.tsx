import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { deepLinkingService } from "@/services/deepLinking";

export const DeepLinkHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Parse tracking parameters and store them
    const trackingParams = deepLinkingService.parseTrackingParams();
    
    if (Object.keys(trackingParams).length > 0) {
      // Store tracking data for analytics
      sessionStorage.setItem('tracking_params', JSON.stringify(trackingParams));
      
      // Track the referral
      deepLinkingService.trackLinkClick('page_visit', location.pathname, trackingParams.utm_source || trackingParams.ref);
      
      // Show welcome message for referred users
      if (trackingParams.utm_source || trackingParams.ref) {
        const source = trackingParams.utm_source || trackingParams.ref;
        toast.success(`Welcome! Thanks for visiting via ${source}`, {
          duration: 5000,
        });
      }
    }

    // Handle special deep link parameters
    const urlParams = new URLSearchParams(location.search);
    
    // Handle search parameter
    const searchQuery = urlParams.get('search');
    if (searchQuery && (location.pathname === '/anime' || location.pathname === '/manga')) {
      // Trigger search with the query
      // This would integrate with your search functionality
      console.log('Auto-searching for:', searchQuery);
    }

    // Handle share parameter for success tracking
    const shareSource = urlParams.get('share_source');
    if (shareSource) {
      toast.success('Thanks for sharing AniVault!', { duration: 3000 });
      deepLinkingService.trackLinkClick('shared_link_opened', location.pathname, shareSource);
    }

    // Handle error recovery - if user lands on a broken link
    const handleBrokenLink = () => {
      const pathSegments = location.pathname.split('/').filter(Boolean);
      
      if (pathSegments.length >= 2) {
        const [type, id] = pathSegments;
        
        if ((type === 'anime' || type === 'manga') && id) {
          // Try to recover by redirecting to the correct page
          // This is handled by React Router, but we can track broken attempts
          deepLinkingService.trackLinkClick('broken_link_attempt', `${type}/${id}`);
        }
      }
    };

    // Check if we might be on a potentially broken link
    const timer = setTimeout(() => {
      // If the page hasn't loaded content after 2 seconds, it might be broken
      const hasContent = document.querySelector('[data-content-loaded]');
      if (!hasContent && location.pathname.includes('/anime/') || location.pathname.includes('/manga/')) {
        handleBrokenLink();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [location, navigate]);

  // This is a utility component that doesn't render anything
  return null;
};

// Hook to get tracking data
export const useTrackingData = () => {
  const getTrackingParams = () => {
    try {
      const stored = sessionStorage.getItem('tracking_params');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  const clearTrackingParams = () => {
    sessionStorage.removeItem('tracking_params');
  };

  return { getTrackingParams, clearTrackingParams };
};