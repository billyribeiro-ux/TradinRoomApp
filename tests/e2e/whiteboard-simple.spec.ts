/**
 * WHITEBOARD SIMPLE DIAGNOSTIC TEST
 * Quick test to diagnose why whiteboard tests are failing
 */

import { test } from '@playwright/test';

test.describe('Whiteboard Diagnostic', () => {
  test('should find whiteboard button', async ({ page }) => {
    // Go to home page
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/homepage.png', fullPage: true });
    
    // Check if we're on login page
    const isLoginPage = await page.locator('input[type="email"]').isVisible().catch(() => false);
    console.log('Is login page:', isLoginPage);
    
    if (isLoginPage) {
      console.log('On login page - need to implement auth');
    } else {
      // Look for whiteboard button
      const whiteboardButtons = await page.locator('button').all();
      console.log(`Found ${whiteboardButtons.length} buttons`);
      
      for (let i = 0; i < Math.min(whiteboardButtons.length, 20); i++) {
        const text = await whiteboardButtons[i].textContent();
        const title = await whiteboardButtons[i].getAttribute('title');
        const ariaLabel = await whiteboardButtons[i].getAttribute('aria-label');
        console.log(`Button ${i}:`, { text, title, ariaLabel });
      }
    }
    
    // Check for canvas
    const canvas = page.locator('[data-testid="whiteboard-canvas"]');
    const canvasExists = await canvas.count();
    console.log('Canvas exists:', canvasExists > 0);
    
    // Log current URL
    console.log('Current URL:', page.url());
  });

  test('should check page structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Get page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check for main elements
    const body = await page.locator('body').innerHTML();
    console.log('Body has whiteboard:', body.includes('whiteboard'));
    console.log('Body has canvas:', body.includes('canvas'));
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/page-structure.png', fullPage: true });
  });
});
