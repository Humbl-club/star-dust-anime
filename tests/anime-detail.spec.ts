import { test, expect } from '@playwright/test';

test.describe('Anime Detail Page', () => {
  test('displays anime information', async ({ page }) => {
    // Go to a specific anime page
    await page.goto('/anime');
    
    // Click first anime card
    await page.locator('.anime-card').first().click();
    
    // Check detail page elements
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Synopsis')).toBeVisible();
    await expect(page.locator('button:has-text("Add to List")').or(page.locator('text=Status'))).toBeVisible();
  });

  test('add to list functionality', async ({ page, context }) => {
    // Mock auth state
    await context.addCookies([{
      name: 'auth-token',
      value: 'mock-token',
      domain: 'localhost',
      path: '/'
    }]);
    
    await page.goto('/anime/test-anime-id');
    
    // Click add to list
    await page.click('button:has-text("Add to List")');
    
    // Check modal or status change
    await expect(page.locator('text=Watching').or(page.locator('[role="dialog"]'))).toBeVisible();
  });
});