import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('home page screenshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Hide dynamic content
    await page.addStyleTag({
      content: '.timestamp { visibility: hidden !important; }'
    });
    
    await expect(page).toHaveScreenshot('home-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('dark mode toggle', async ({ page }) => {
    await page.goto('/');
    
    // Toggle dark mode
    await page.click('button[aria-label="Toggle theme"]');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('dark-mode.png');
  });

  test('anime listing page', async ({ page }) => {
    await page.goto('/anime');
    await page.waitForLoadState('networkidle');
    
    // Hide dynamic elements that might change
    await page.addStyleTag({
      content: `
        .timestamp, .relative-time { visibility: hidden !important; }
        .loading-spinner { display: none !important; }
      `
    });
    
    await expect(page).toHaveScreenshot('anime-listing.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('manga listing page', async ({ page }) => {
    await page.goto('/manga');
    await page.waitForLoadState('networkidle');
    
    // Hide dynamic elements
    await page.addStyleTag({
      content: `
        .timestamp, .relative-time { visibility: hidden !important; }
        .loading-spinner { display: none !important; }
      `
    });
    
    await expect(page).toHaveScreenshot('manga-listing.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('mobile viewport home page', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Hide dynamic content
    await page.addStyleTag({
      content: '.timestamp { visibility: hidden !important; }'
    });
    
    await expect(page).toHaveScreenshot('mobile-home.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('search results visual', async ({ page }) => {
    await page.goto('/');
    
    // Perform search
    await page.fill('input[placeholder*="Search"]', 'Naruto');
    await page.waitForTimeout(1000);
    
    // Wait for dropdown to appear
    await page.waitForSelector('[role="listbox"]', { state: 'visible' });
    
    // Take screenshot of search dropdown
    await expect(page.locator('[role="listbox"]')).toHaveScreenshot('search-dropdown.png');
  });

  test('error state visual', async ({ page }) => {
    // Navigate to non-existent page to trigger error
    await page.goto('/non-existent-page');
    
    // Wait for error boundary to render
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('error-state.png');
  });

  test('loading states', async ({ page }) => {
    // Slow down network to capture loading state
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 100);
    });
    
    await page.goto('/anime');
    
    // Capture loading state
    await page.waitForSelector('.loading-spinner', { state: 'visible', timeout: 5000 });
    await expect(page.locator('.loading-spinner')).toHaveScreenshot('loading-spinner.png');
  });
});