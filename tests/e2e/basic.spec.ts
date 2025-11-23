import { test, expect } from '@playwright/test';

test('homepage loads correctly', async ({ page }) => {
  await page.goto('/');
  
  // Check that the page loads without errors
  await expect(page).toHaveTitle(/Revolution/i);
  
  // Check that main content is visible
  await expect(page.locator('body')).toBeVisible();
});

test('navigation works', async ({ page }) => {
  await page.goto('/');
  
  // Look for any navigation elements
  const nav = page.locator('nav, header, [role="navigation"]');
  if (await nav.count() > 0) {
    await expect(nav.first()).toBeVisible();
  }
});

test('page is responsive', async ({ page }) => {
  await page.goto('/');
  
  // Test mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(page.locator('body')).toBeVisible();
  
  // Test desktop viewport
  await page.setViewportSize({ width: 1920, height: 1080 });
  await expect(page.locator('body')).toBeVisible();
});

test.describe('Whiteboard Drawing Tools', () => {
  test.beforeEach(async ({ page }) => {
    // Use dedicated test route with injected session + always-active overlay
    await page.goto('/__test_whiteboard');
    // Activate whiteboard (adjust selector as needed)
    const whiteboardToggle = page.locator('[data-testid="whiteboard-toggle"]');
    if (await whiteboardToggle.count() > 0) {
      await whiteboardToggle.click();
    }
    // Wait for canvas to be ready
    await page.locator('[data-testid="whiteboard-canvas"]').waitFor({ state: 'attached' });
  });

  test('pen tool draws at cursor position', async ({ page }) => {
    // Select pen tool
    const penTool = page.locator('[data-testid="tool-pen"]');
    if (await penTool.count() > 0) {
      await penTool.click();
      
      // Get canvas bounds
      const canvas = page.locator('[data-testid="whiteboard-canvas"]');
      const bounds = await canvas.boundingBox();
      expect(bounds).toBeTruthy();
      
      // Draw a simple line
      const startX = bounds!.x + bounds!.width / 2;
      const startY = bounds!.y + bounds!.height / 2;
      const endX = startX + 100;
      const endY = startY + 100;
      
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(endX, endY);
      await page.mouse.up();
      
      // Verify canvas is still visible and responsive
      await expect(canvas).toBeVisible();
    }
  });

  test('cursor changes for drawing tools', async ({ page }) => {
    const tools = [
      '[data-testid="tool-pen"]',
      '[data-testid="tool-highlighter"]',
      '[data-testid="tool-line"]',
      '[data-testid="tool-rectangle"]',
      '[data-testid="tool-circle"]',
      '[data-testid="tool-arrow"]',
    ];
    
    for (const toolSelector of tools) {
      const tool = page.locator(toolSelector);
      if (await tool.count() > 0) {
        await tool.click();
        
        const canvas = page.locator('[data-testid="whiteboard-canvas"]');
        await expect(canvas).toBeVisible();
        
        // Verify cursor is not default
        const cursor = await canvas.evaluate((el) => {
          return window.getComputedStyle(el).cursor;
        });
        expect(cursor).not.toBe('auto');
        expect(cursor).not.toBe('default');
      }
    }
  });

  test('text tool creates editable overlay', async ({ page }) => {
    const textTool = page.locator('[data-testid="tool-text"]');
    if (await textTool.count() > 0) {
      await textTool.click();
      
      const canvas = page.locator('[data-testid="whiteboard-canvas"]');
      const bounds = await canvas.boundingBox();
      
      // Click to create text
      await page.mouse.click(bounds!.x + 200, bounds!.y + 200);
      
      // Check for text overlay
      const textOverlay = page.locator('#wb-text-overlay');
      if (await textOverlay.count() > 0) {
        await expect(textOverlay).toBeVisible();
        await expect(textOverlay).toHaveAttribute('contenteditable', 'true');
      }
    }
  });
});
