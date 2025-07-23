import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('measures page load metrics', async ({ page }) => {
    const metrics: any = {};
    
    page.on('load', async () => {
      metrics.performance = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as any;
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        };
      });
    });
    
    await page.goto('/');
    
    // Performance assertions
    expect(metrics.performance.domContentLoaded).toBeLessThan(3000);
    expect(metrics.performance.loadComplete).toBeLessThan(5000);
  });

  test('lazy loading works', async ({ page }) => {
    await page.goto('/anime');
    
    // Check initial images loaded
    const initialImages = await page.locator('img[loading="lazy"]').count();
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    
    // More images should be loaded
    const loadedImages = await page.locator('img[src]').count();
    expect(loadedImages).toBeGreaterThan(initialImages);
  });

  test('measures core web vitals', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const vitals = await page.evaluate(() => {
      return new Promise(resolve => {
        let fcp = 0;
        let lcp = 0;
        let cls = 0;
        
        // First Contentful Paint
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          if (entries.length > 0) {
            fcp = entries[0].startTime;
          }
        }).observe({ type: 'paint', buffered: true });
        
        // Largest Contentful Paint
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          if (entries.length > 0) {
            lcp = entries[entries.length - 1].startTime;
          }
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        
        // Cumulative Layout Shift
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });
        
        setTimeout(() => {
          resolve({ fcp, lcp, cls });
        }, 3000);
      });
    });
    
    // Core Web Vitals thresholds
    expect((vitals as any).fcp).toBeLessThan(1800); // First Contentful Paint < 1.8s
    expect((vitals as any).lcp).toBeLessThan(2500); // Largest Contentful Paint < 2.5s
    expect((vitals as any).cls).toBeLessThan(0.1);  // Cumulative Layout Shift < 0.1
  });

  test('bundle size check', async ({ page }) => {
    await page.goto('/');
    
    const resourceSizes = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      const jsSize = resources
        .filter(r => r.name.includes('.js'))
        .reduce((sum, r) => sum + (r as any).transferSize, 0);
      const cssSize = resources
        .filter(r => r.name.includes('.css'))
        .reduce((sum, r) => sum + (r as any).transferSize, 0);
      
      return { jsSize, cssSize };
    });
    
    // Bundle size assertions (in bytes)
    expect(resourceSizes.jsSize).toBeLessThan(1000000); // JS bundle < 1MB
    expect(resourceSizes.cssSize).toBeLessThan(100000);  // CSS bundle < 100KB
  });

  test('infinite scroll performance', async ({ page }) => {
    await page.goto('/anime');
    
    const startTime = Date.now();
    const initialItemCount = await page.locator('.anime-card').count();
    
    // Scroll to trigger infinite scroll
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Wait for new items to load
    await page.waitForFunction(
      (initial) => document.querySelectorAll('.anime-card').length > initial,
      initialItemCount,
      { timeout: 5000 }
    );
    
    const loadTime = Date.now() - startTime;
    const newItemCount = await page.locator('.anime-card').count();
    
    // Performance assertions
    expect(loadTime).toBeLessThan(3000); // Load time < 3s
    expect(newItemCount).toBeGreaterThan(initialItemCount);
  });

  test('search performance', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.locator('input[placeholder*="Search"]');
    
    // Measure search response time
    const startTime = Date.now();
    await searchInput.fill('Naruto');
    
    // Wait for search results
    await page.waitForSelector('[role="listbox"]', { state: 'visible' });
    const searchTime = Date.now() - startTime;
    
    // Search should be fast
    expect(searchTime).toBeLessThan(2000);
    
    // Results should be visible
    const resultCount = await page.locator('[role="option"]').count();
    expect(resultCount).toBeGreaterThan(0);
  });
});