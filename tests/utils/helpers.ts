import { Page, expect } from '@playwright/test';

export async function login(page: Page, email: string, password: string) {
  await page.goto('/auth');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
}

export async function waitForContent(page: Page) {
  await page.waitForLoadState('networkidle');
  await expect(page.locator('.content-grid')).toBeVisible();
}

export async function searchContent(page: Page, query: string) {
  await page.fill('input[placeholder*="Search"]', query);
  await page.waitForTimeout(500); // Wait for debounce
  await expect(page.locator('[role="listbox"]')).toBeVisible();
}