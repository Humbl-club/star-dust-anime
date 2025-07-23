import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('sign up flow', async ({ page }) => {
    await page.goto('/auth?tab=signup');
    
    const email = `test${Date.now()}@example.com`;
    
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button:has-text("Sign Up")');
    
    // Check for success or verification message
    await expect(page.locator('text=verify')).toBeVisible({ timeout: 10000 });
  });

  test('login flow', async ({ page }) => {
    await page.goto('/auth');
    
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should show error for invalid credentials
    await expect(page.locator('text=Invalid')).toBeVisible();
  });
});