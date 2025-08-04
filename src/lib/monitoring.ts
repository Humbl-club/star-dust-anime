import { supabase } from '@/integrations/supabase/client';

interface PerformanceMetric {
  name: string;
  value: number;
  tags?: Record<string, string>;
}

class ProductionMonitor {
  private queue: PerformanceMetric[] = [];
  private flushInterval: number = 30000; // 30 seconds
  
  constructor() {
    if (import.meta.env.PROD) {
      this.startFlushInterval();
      this.setupPerformanceObserver();
    }
  }
  
  private setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      // Monitor long tasks
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.track('long_task', entry.duration, {
            name: entry.name,
            startTime: entry.startTime.toString()
          });
        }
      });
      
      observer.observe({ entryTypes: ['longtask'] });
    }
  }
  
  track(name: string, value: number, tags?: Record<string, string>) {
    this.queue.push({ name, value, tags });
    
    // Flush immediately if queue is large
    if (this.queue.length >= 100) {
      this.flush();
    }
  }
  
  trackPageLoad() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    this.track('page_load_time', navigation.loadEventEnd - navigation.loadEventStart);
    this.track('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
    this.track('time_to_first_byte', navigation.responseStart - navigation.requestStart);
  }
  
  trackApiCall(endpoint: string, duration: number, status: number) {
    this.track('api_call_duration', duration, {
      endpoint,
      status: status.toString(),
      success: (status >= 200 && status < 300).toString()
    });
  }
  
  private async flush() {
    if (this.queue.length === 0) return;
    
    const metrics = [...this.queue];
    this.queue = [];
    
    try {
      await supabase.from('performance_metrics').insert(
        metrics.map(metric => ({
          ...metric,
          timestamp: new Date().toISOString(),
          session_id: this.getSessionId()
        }))
      );
    } catch (error) {
      console.error('Failed to flush metrics:', error);
      // Re-add metrics to queue
      this.queue.unshift(...metrics);
    }
  }
  
  private startFlushInterval() {
    setInterval(() => this.flush(), this.flushInterval);
    
    // Flush on page unload
    window.addEventListener('beforeunload', () => this.flush());
  }
  
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('monitoring_session_id');
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('monitoring_session_id', sessionId);
    }
    return sessionId;
  }
}

export const monitor = new ProductionMonitor();