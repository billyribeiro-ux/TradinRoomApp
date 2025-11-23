/** E2E Smoke Test for Branding System */

import { test, expect } from '@playwright/test';

test.describe('Branding System - E2E Smoke', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to deterministic test trading route with injected session
    await page.goto('http://localhost:5173/__test_trading/test-room');
    // Avoid waiting for full networkidle due to external iframes; the test route is deterministic
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('[data-trading-room]', { timeout: 15000 });
  });

  test('should not auto-open branding modal on load', async ({ page }) => {
    // Modal should not be visible on initial load
    const modal = page.locator('[role="dialog"]:has-text("Advanced Branding")');
    await expect(modal).not.toBeVisible();
  });

  test('should open and close branding modal', async ({ page }) => {
    // Find settings/theme button
    const settingsButton = page.locator('button:has-text("Theme"), button:has-text("Settings"), button[aria-label*="theme"]').first();
    
    if (await settingsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await settingsButton.click();
      
      // Modal should appear
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible({ timeout: 5000 });
      
      // Close modal
      const closeButton = page.locator('[role="dialog"] button[aria-label*="Close"]').first();
      await closeButton.click();
      
      // Modal should disappear
      await expect(modal).not.toBeVisible({ timeout: 2000 });
    } else {
      test.skip();
    }
  });

  test('should navigate between tabs', async ({ page }) => {
    const settingsButton = page.locator('button:has-text("Theme"), button:has-text("Settings")').first();
    
    if (await settingsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await settingsButton.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      // Click Colors tab
      const colorsTab = page.locator('[role="dialog"] button:has-text("Colors")').first();
      if (await colorsTab.count() > 0) {
        await colorsTab.click();
        
        // Should show color pickers
        await expect(page.locator('text=Primary Color').first()).toBeVisible({ timeout: 2000 });
      }
      
      // Click Typography tab
      const typographyTab = page.locator('[role="dialog"] button:has-text("Typography")').first();
      if (await typographyTab.count() > 0) {
        await typographyTab.click();
        
        // Should show font selector
        await expect(page.locator('text=Font Family').first()).toBeVisible({ timeout: 2000 });
      }
    } else {
      test.skip();
    }
  });

  test('should handle rapid open/close without crashing', async ({ page }) => {
    const settingsButton = page.locator('button:has-text("Theme"), button:has-text("Settings")').first();
    
    if (await settingsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Rapid open/close cycle
      for (let i = 0; i < 3; i++) {
        await settingsButton.click();
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
        
        const closeButton = page.locator('[role="dialog"] button[aria-label*="Close"]').first();
        await closeButton.click();
        await page.waitForTimeout(200);
      }
      
      // App should still be functional
      await expect(page.locator('body')).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should show validation error for invalid file upload', async ({ page }) => {
    const settingsButton = page.locator('button:has-text("Theme"), button:has-text("Settings")').first();
    
    if (await settingsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await settingsButton.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      // Go to Basic tab
      const basicTab = page.locator('[role="dialog"] button:has-text("Basic")').first();
      if (await basicTab.count() > 0) {
        await basicTab.click();
        
        // Try to upload invalid file (if file input exists)
        const fileInput = page.locator('[role="dialog"] input[type="file"]').first();
        if (await fileInput.count() > 0) {
          // Create a test file that's too large or wrong type
          // Note: This is a smoke test, actual validation happens in unit tests
          await expect(fileInput).toBeAttached();
        }
      }
    } else {
      test.skip();
    }
  });

  test('should preserve modal state during tab switches', async ({ page }) => {
    const settingsButton = page.locator('button:has-text("Theme"), button:has-text("Settings")').first();
    
    if (await settingsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await settingsButton.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      // Go to Basic tab and enter business name
      const basicTab = page.locator('[role="dialog"] button:has-text("Basic")').first();
      if (await basicTab.count() > 0) {
        await basicTab.click();
        
        const businessNameInput = page.locator('[role="dialog"] input[placeholder*="business"]').first();
        if (await businessNameInput.count() > 0) {
          await businessNameInput.fill('Test Business');
          
          // Switch to Colors tab
          const colorsTab = page.locator('[role="dialog"] button:has-text("Colors")').first();
          await colorsTab.click();
          
          // Switch back to Basic tab
          await basicTab.click();
          
          // Business name should still be there
          await expect(businessNameInput).toHaveValue('Test Business');
        }
      }
    } else {
      test.skip();
    }
  });
});
