import { useEffect, useCallback } from 'react';
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

interface PerformanceMetrics {
  name: string;
  value: number;
  delta: number;
  entries: PerformanceEntry[];
  id: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

interface UsePerformanceMonitoringOptions {
  reportWebVitals?: boolean;
  reportCustomMetrics?: boolean;
  onMetric?: (metric: PerformanceMetrics) => void;
}

export const usePerformanceMonitoring = ({
  reportWebVitals = true,
  reportCustomMetrics = true,
  onMetric
}: UsePerformanceMonitoringOptions = {}) => {

  const reportMetric = useCallback((metric: PerformanceMetrics) => {
    // Send to analytics or logging service
    console.log('Performance Metric:', metric);
    
    // Store in localStorage for debugging
    const existingMetrics = JSON.parse(localStorage.getItem('performance-metrics') || '[]');
    existingMetrics.push({
      ...metric,
      timestamp: Date.now(),
      url: window.location.pathname
    });
    
    // Keep only last 50 metrics
    if (existingMetrics.length > 50) {
      existingMetrics.shift();
    }
    
    localStorage.setItem('performance-metrics', JSON.stringify(existingMetrics));
    
    if (onMetric) {
      onMetric(metric);
    }
  }, [onMetric]);

  // Initialize Web Vitals monitoring
  useEffect(() => {
    if (!reportWebVitals) return;

    // Core Web Vitals
    onCLS(reportMetric);
    onINP(reportMetric);
    onFCP(reportMetric);
    onLCP(reportMetric);
    onTTFB(reportMetric);
  }, [reportWebVitals, reportMetric]);

  // Custom performance marks
  const markStart = useCallback((markName: string) => {
    if (performance.mark) {
      performance.mark(`${markName}-start`);
    }
  }, []);

  const markEnd = useCallback((markName: string) => {
    if (performance.mark && performance.measure) {
      performance.mark(`${markName}-end`);
      performance.measure(markName, `${markName}-start`, `${markName}-end`);
      
      // Get the measurement
      const measures = performance.getEntriesByName(markName, 'measure');
      if (measures.length > 0) {
        const measure = measures[measures.length - 1];
        reportMetric({
          name: markName,
          value: measure.duration,
          delta: measure.duration,
          entries: [measure],
          id: Math.random().toString(36).substr(2, 9),
          rating: measure.duration < 100 ? 'good' : measure.duration < 300 ? 'needs-improvement' : 'poor'
        });
      }
    }
  }, [reportMetric]);

  // Monitor resource loading
  const observeResourceTiming = useCallback(() => {
    if (!reportCustomMetrics) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming;
          
          // Report slow resources
          if (resource.duration > 1000) {
            reportMetric({
              name: 'slow-resource',
              value: resource.duration,
              delta: resource.duration,
              entries: [resource],
              id: Math.random().toString(36).substr(2, 9),
              rating: 'poor'
            });
          }
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });

    return () => observer.disconnect();
  }, [reportCustomMetrics, reportMetric]);

  // Monitor navigation timing
  const observeNavigationTiming = useCallback(() => {
    if (!reportCustomMetrics) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const nav = entry as PerformanceNavigationTiming;
          
          // Report various navigation metrics
          const metrics = [
            { name: 'dns-lookup', value: nav.domainLookupEnd - nav.domainLookupStart },
            { name: 'tcp-connect', value: nav.connectEnd - nav.connectStart },
            { name: 'server-response', value: nav.responseEnd - nav.requestStart },
            { name: 'dom-processing', value: nav.domComplete - nav.domContentLoadedEventStart }
          ];

          metrics.forEach(metric => {
            if (metric.value > 0) {
              reportMetric({
                ...metric,
                delta: metric.value,
                entries: [nav],
                id: Math.random().toString(36).substr(2, 9),
                rating: metric.value < 100 ? 'good' : metric.value < 300 ? 'needs-improvement' : 'poor'
              });
            }
          });
        }
      }
    });

    observer.observe({ entryTypes: ['navigation'] });

    return () => observer.disconnect();
  }, [reportCustomMetrics, reportMetric]);

  // Initialize observers
  useEffect(() => {
    const cleanup1 = observeResourceTiming();
    const cleanup2 = observeNavigationTiming();

    return () => {
      cleanup1?.();
      cleanup2?.();
    };
  }, [observeResourceTiming, observeNavigationTiming]);

  // Get stored metrics
  const getStoredMetrics = useCallback(() => {
    return JSON.parse(localStorage.getItem('performance-metrics') || '[]');
  }, []);

  // Clear stored metrics
  const clearStoredMetrics = useCallback(() => {
    localStorage.removeItem('performance-metrics');
  }, []);

  return {
    markStart,
    markEnd,
    getStoredMetrics,
    clearStoredMetrics
  };
};
