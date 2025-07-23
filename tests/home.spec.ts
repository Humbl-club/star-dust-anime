import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('loads and displays content', async ({ page }) => {
    await page.goto('/');
    
    // Check hero section
    await expect(page.locator('h1')).toContainText('Discover Your Next');
    
    // Check navigation
    await expect(page.locator('nav')).toBeVisible();
    
    // Check content sections
    await expect(page.locator('text=Trending Anime')).toBeVisible();
    await expect(page.locator('.content-grid').first()).toBeVisible();
  });

  test('search functionality works', async ({ page }) => {
    await page.goto('/');
    
    // Search for content
    await page.fill('input[placeholder*="Search"]', 'Naruto');
    await page.waitForTimeout(500);
    
    // Check dropdown appears
    await expect(page.locator('[role="listbox"]')).toBeVisible();
    
    // Click first result
    await page.locator('[role="option"]').first().click();
    
    // Should navigate to detail page
    await expect(page).toHaveURL(/\/(anime|manga)\/[\w-]+/);
  });
});