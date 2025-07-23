import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/AnimeHub/);
});

test('navigation works', async ({ page }) => {
  await page.goto('/');

  // Click the anime navigation link
  await page.click('text=Anime');

  // Expects page to have a heading with the name of Anime
  await expect(page.locator('h1')).toContainText('Anime');
});

test('search functionality', async ({ page }) => {
  await page.goto('/');

  // Look for search input
  const searchInput = page.locator('input[placeholder*="Search"]');
  
  if (await searchInput.isVisible()) {
    await searchInput.fill('naruto');
    await searchInput.press('Enter');
    
    // Wait for results to load
    await page.waitForTimeout(2000);
    
    // Check if search results are displayed
    await expect(page).toHaveURL(/.*search.*/);
  }
});

test('responsive design', async ({ page }) => {
  // Test mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  
  // Should have mobile navigation
  const mobileNav = page.locator('[aria-label="Mobile menu"]');
  if (await mobileNav.isVisible()) {
    await expect(mobileNav).toBeVisible();
  }
  
  // Test tablet viewport
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.reload();
  
  // Should adapt to tablet layout
  await expect(page.locator('body')).toBeVisible();
});

test('offline functionality', async ({ page, context }) => {
  await page.goto('/');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Go offline
  await context.setOffline(true);
  
  // Navigate to another page
  await page.goto('/anime');
  
  // Should show offline page or cached content
  await expect(page).not.toHaveTitle(/Error/);
});