interface AnalyticsEvent {
  event: string;
  category?: string;
  label?: string;
  value?: number;
  [key: string]: any;
}

class PWAAnalytics {
  private isGTagLoaded: boolean = false;

  constructor() {
    this.checkGTagAvailability();
  }

  private checkGTagAvailability() {
    this.isGTagLoaded = typeof (window as any).gtag !== 'undefined';
    
    // If gtag is not available, set up a basic tracking fallback
    if (!this.isGTagLoaded) {
      console.warn('Google Analytics not loaded, using console logging for PWA events');
    }
  }

  private track(event: AnalyticsEvent) {
    if (this.isGTagLoaded) {
      (window as any).gtag('event', event.event, {
        event_category: event.category || 'PWA',
        event_label: event.label,
        value: event.value,
        ...event
      });
    } else {
      // Fallback: Log to console and localStorage for debugging
      console.log('PWA Analytics Event:', event);
      
      try {
        const events = JSON.parse(localStorage.getItem('pwa_analytics_events') || '[]');
        events.push({
          ...event,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent
        });
        
        // Keep only last 100 events
        if (events.length > 100) {
          events.splice(0, events.length - 100);
        }
        
        localStorage.setItem('pwa_analytics_events', JSON.stringify(events));
      } catch (error) {
        console.error('Failed to store analytics event:', error);
      }
    }
  }

  // Install Events
  trackInstallPromptShown(platform: 'mobile' | 'desktop' | 'unknown') {
    this.track({
      event: 'pwa_install_prompt_shown',
      category: 'PWA Install',
      label: platform,
      platform
    });
  }

  trackInstallPromptDismissed(platform: 'mobile' | 'desktop' | 'unknown', method: 'button' | 'outside_click' | 'timeout') {
    this.track({
      event: 'pwa_install_prompt_dismissed',
      category: 'PWA Install',
      label: `${platform}_${method}`,
      platform,
      method
    });
  }

  trackInstallAttempted(platform: 'mobile' | 'desktop' | 'unknown', method: 'browser_prompt' | 'manual_instructions') {
    this.track({
      event: 'pwa_install_attempted',
      category: 'PWA Install',
      label: `${platform}_${method}`,
      platform,
      method
    });
  }

  trackInstallSuccess(platform: 'mobile' | 'desktop' | 'unknown') {
    this.track({
      event: 'pwa_install_success',
      category: 'PWA Install',
      label: platform,
      value: 1,
      platform
    });
  }

  trackInstallError(platform: 'mobile' | 'desktop' | 'unknown', error: string) {
    this.track({
      event: 'pwa_install_error',
      category: 'PWA Install',
      label: `${platform}_error`,
      platform,
      error
    });
  }

  // Offline Events
  trackOfflineUsage(action: 'view_cached_content' | 'offline_modification' | 'sync_retry') {
    this.track({
      event: 'pwa_offline_usage',
      category: 'PWA Offline',
      label: action,
      action
    });
  }

  trackCacheHit(contentType: 'anime' | 'manga' | 'search' | 'list') {
    this.track({
      event: 'pwa_cache_hit',
      category: 'PWA Cache',
      label: contentType,
      contentType
    });
  }

  trackBackgroundSync(status: 'triggered' | 'success' | 'failed', itemCount?: number) {
    this.track({
      event: 'pwa_background_sync',
      category: 'PWA Sync',
      label: status,
      value: itemCount,
      status,
      itemCount
    });
  }

  // Push Notification Events
  trackPushPermissionRequest() {
    this.track({
      event: 'pwa_push_permission_requested',
      category: 'PWA Push Notifications',
      label: 'permission_requested'
    });
  }

  trackPushPermissionResult(granted: boolean) {
    this.track({
      event: 'pwa_push_permission_result',
      category: 'PWA Push Notifications',
      label: granted ? 'granted' : 'denied',
      value: granted ? 1 : 0,
      granted
    });
  }

  trackPushSubscription(success: boolean) {
    this.track({
      event: 'pwa_push_subscription',
      category: 'PWA Push Notifications',
      label: success ? 'success' : 'failed',
      value: success ? 1 : 0,
      success
    });
  }

  trackPushNotificationReceived(type?: string) {
    this.track({
      event: 'pwa_push_notification_received',
      category: 'PWA Push Notifications',
      label: type || 'general',
      type
    });
  }

  trackPushNotificationClicked(type?: string) {
    this.track({
      event: 'pwa_push_notification_clicked',
      category: 'PWA Push Notifications',
      label: type || 'general',
      value: 1,
      type
    });
  }

  // Usage Events
  trackPWASessionStart(isStandalone: boolean) {
    this.track({
      event: 'pwa_session_start',
      category: 'PWA Usage',
      label: isStandalone ? 'standalone' : 'browser',
      isStandalone
    });
  }

  trackPWAFeatureUsage(feature: 'offline_mode' | 'add_to_homescreen' | 'share' | 'fullscreen') {
    this.track({
      event: 'pwa_feature_usage',
      category: 'PWA Features',
      label: feature,
      feature
    });
  }

  // Platform Detection
  trackPlatformDetection() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad|Android|Tablet/i.test(navigator.userAgent);
    
    this.track({
      event: 'pwa_platform_detection',
      category: 'PWA Platform',
      label: 'detected',
      isStandalone,
      isInWebAppiOS,
      isMobile,
      isTablet,
      userAgent: navigator.userAgent,
      displayMode: isStandalone ? 'standalone' : 'browser'
    });
  }

  // Network Events
  trackNetworkStatus(online: boolean) {
    this.track({
      event: 'pwa_network_status',
      category: 'PWA Network',
      label: online ? 'online' : 'offline',
      online
    });
  }

  // Performance Events
  trackLoadPerformance(loadTime: number, cacheHit: boolean) {
    this.track({
      event: 'pwa_load_performance',
      category: 'PWA Performance',
      label: cacheHit ? 'cache_hit' : 'network_load',
      value: Math.round(loadTime),
      loadTime,
      cacheHit
    });
  }

  // Export analytics data for debugging
  exportAnalyticsData(): any[] {
    try {
      return JSON.parse(localStorage.getItem('pwa_analytics_events') || '[]');
    } catch (error) {
      console.error('Failed to export analytics data:', error);
      return [];
    }
  }

  // Clear analytics data
  clearAnalyticsData() {
    try {
      localStorage.removeItem('pwa_analytics_events');
      console.log('Analytics data cleared');
    } catch (error) {
      console.error('Failed to clear analytics data:', error);
    }
  }
}

// Export singleton instance
export const pwaAnalytics = new PWAAnalytics();

// Auto-track session start and platform detection on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    pwaAnalytics.trackPWASessionStart(isStandalone);
    pwaAnalytics.trackPlatformDetection();
  });

  // Track network status changes
  window.addEventListener('online', () => pwaAnalytics.trackNetworkStatus(true));
  window.addEventListener('offline', () => pwaAnalytics.trackNetworkStatus(false));
}
