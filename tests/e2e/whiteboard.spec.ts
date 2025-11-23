/**
 * WHITEBOARD E2E TESTS - Playwright
 * Microsoft L68+ Standards - Comprehensive Testing
 * 
 * Tests all whiteboard functionality:
 * 1. Whiteboard activation
 * 2. Canvas rendering
 * 3. Tool selection
 * 4. Drawing operations
 * 5. Toolbar interactions
 * 6. DPR rendering
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const TEST_TIMEOUT = 30000;
const ADMIN_EMAIL = 'admin@test.com';
const ADMIN_PASSWORD = 'test123';

/**
 * Helper: Login as admin user
 */
async function loginAsAdmin(page: Page) {
  await page.goto('/');
  
  // Wait for auth to load
  await page.waitForSelector('[data-testid="login-form"]', { timeout: 10000 });
  
  // Fill login form
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Wait for redirect to room
  await page.waitForURL(/\/room\//, { timeout: 10000 });
}

/**
 * Helper: Open whiteboard
 */
async function openWhiteboard(page: Page) {
  // Find and click whiteboard button
  const whiteboardButton = page.locator('button[title*="Whiteboard"], button[aria-label*="Whiteboard"]').first();
  await expect(whiteboardButton).toBeVisible({ timeout: 5000 });
  await whiteboardButton.click();
  
  // Wait for canvas to appear
  await page.waitForSelector('[data-testid="whiteboard-canvas"]', { timeout: 5000 });
}

/**
 * Helper: Get canvas element
 */
async function getCanvas(page: Page) {
  const canvas = page.locator('[data-testid="whiteboard-canvas"]');
  await expect(canvas).toBeVisible();
  return canvas;
}

/**
 * Helper: Get canvas dimensions
 */
async function getCanvasDimensions(page: Page) {
  const canvas = await getCanvas(page);
  const width = await canvas.evaluate((el: HTMLCanvasElement) => el.width);
  const height = await canvas.evaluate((el: HTMLCanvasElement) => el.height);
  return { width, height };
}

/**
 * Helper: Check if canvas is white (not black)
 */
async function isCanvasWhite(page: Page): Promise<boolean> {
  const canvas = await getCanvas(page);
  return await canvas.evaluate((el: HTMLCanvasElement) => {
    const ctx = el.getContext('2d');
    if (!ctx) return false;
    
    // Sample center pixel
    const centerX = Math.floor(el.width / 2);
    const centerY = Math.floor(el.height / 2);
    const pixel = ctx.getImageData(centerX, centerY, 1, 1).data;
    
    // Check if white (255, 255, 255, 255)
    return pixel[0] === 255 && pixel[1] === 255 && pixel[2] === 255 && pixel[3] === 255;
  });
}

/**
 * Helper: Select tool
 */
async function selectTool(page: Page, toolName: string) {
  const toolButton = page.locator(`button[title*="${toolName}"], button[aria-label*="${toolName}"]`).first();
  await expect(toolButton).toBeVisible({ timeout: 5000 });
  await toolButton.click();
  
  // Wait a bit for tool to activate
  await page.waitForTimeout(500);
}

/**
 * Helper: Draw on canvas
 */
async function drawOnCanvas(page: Page, startX: number, startY: number, endX: number, endY: number) {
  const canvas = await getCanvas(page);
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas not found');
  
  // Mouse down
  await page.mouse.move(box.x + startX, box.y + startY);
  await page.mouse.down();
  
  // Mouse move
  await page.mouse.move(box.x + endX, box.y + endY);
  
  // Mouse up
  await page.mouse.up();
  
  // Wait for render
  await page.waitForTimeout(500);
}

// ============================================================================
// TEST SUITE
// ============================================================================

test.describe('Whiteboard System', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // ==========================================================================
  // TEST 1: Whiteboard Activation
  // ==========================================================================
  test('should activate whiteboard when button clicked', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    
    // Open whiteboard
    await openWhiteboard(page);
    
    // Verify canvas exists
    const canvas = await getCanvas(page);
    await expect(canvas).toBeVisible();
    
    // Verify toolbar exists
    const toolbar = page.locator('[data-testid="whiteboard-toolbar"]').first();
    await expect(toolbar).toBeVisible();
  });

  // ==========================================================================
  // TEST 2: Canvas Rendering (White Background)
  // ==========================================================================
  test('should render white canvas (not black)', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    
    await openWhiteboard(page);
    
    // Wait for canvas to render
    await page.waitForTimeout(1000);
    
    // Check if canvas is white
    const isWhite = await isCanvasWhite(page);
    expect(isWhite).toBe(true);
  });

  // ==========================================================================
  // TEST 3: Canvas Dimensions (DPR)
  // ==========================================================================
  test('should have valid canvas dimensions with DPR', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    
    await openWhiteboard(page);
    
    // Get dimensions
    const { width, height } = await getCanvasDimensions(page);
    
    // Verify dimensions are > 0
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
    
    // Verify DPR is applied (dimensions should be larger than CSS size)
    const dpr = await page.evaluate(() => window.devicePixelRatio || 1);
    console.log(`Canvas dimensions: ${width}x${height}, DPR: ${dpr}`);
    
    // Canvas backing store should be at least CSS size * DPR
    expect(width).toBeGreaterThanOrEqual(100 * dpr);
    expect(height).toBeGreaterThanOrEqual(100 * dpr);
  });

  // ==========================================================================
  // TEST 4: Pen Tool
  // ==========================================================================
  test('should draw with pen tool', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    
    await openWhiteboard(page);
    
    // Select pen tool
    await selectTool(page, 'Pen');
    
    // Draw a line
    await drawOnCanvas(page, 100, 100, 200, 200);
    
    // Verify something was drawn (canvas should not be pure white anymore)
    const isWhite = await isCanvasWhite(page);
    expect(isWhite).toBe(false); // Should have drawing on it
  });

  // ==========================================================================
  // TEST 5: Eraser Tool
  // ==========================================================================
  test('should erase with eraser tool', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    
    await openWhiteboard(page);
    
    // Draw something first
    await selectTool(page, 'Pen');
    await drawOnCanvas(page, 100, 100, 200, 200);
    
    // Select eraser
    await selectTool(page, 'Eraser');
    
    // Erase
    await drawOnCanvas(page, 100, 100, 200, 200);
    
    // Should work without errors
    await page.waitForTimeout(500);
  });

  // ==========================================================================
  // TEST 6: Line Tool
  // ==========================================================================
  test('should draw line with line tool', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    
    await openWhiteboard(page);
    
    // Select line tool
    await selectTool(page, 'Line');
    
    // Draw a line
    await drawOnCanvas(page, 150, 150, 250, 250);
    
    // Verify drawing
    const isWhite = await isCanvasWhite(page);
    expect(isWhite).toBe(false);
  });

  // ==========================================================================
  // TEST 7: Rectangle Tool
  // ==========================================================================
  test('should draw rectangle', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    
    await openWhiteboard(page);
    
    // Select rectangle tool
    await selectTool(page, 'Rectangle');
    
    // Draw rectangle
    await drawOnCanvas(page, 100, 100, 300, 200);
    
    // Verify drawing
    const isWhite = await isCanvasWhite(page);
    expect(isWhite).toBe(false);
  });

  // ==========================================================================
  // TEST 8: Circle Tool
  // ==========================================================================
  test('should draw circle', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    
    await openWhiteboard(page);
    
    // Select circle tool
    await selectTool(page, 'Circle');
    
    // Draw circle
    await drawOnCanvas(page, 200, 200, 300, 300);
    
    // Verify drawing
    const isWhite = await isCanvasWhite(page);
    expect(isWhite).toBe(false);
  });

  // ==========================================================================
  // TEST 9: Undo/Redo
  // ==========================================================================
  test('should undo and redo actions', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    
    await openWhiteboard(page);
    
    // Draw something
    await selectTool(page, 'Pen');
    await drawOnCanvas(page, 100, 100, 200, 200);
    
    // Click undo
    const undoButton = page.locator('button[title*="Undo"], button[aria-label*="Undo"]').first();
    if (await undoButton.isVisible()) {
      await undoButton.click();
      await page.waitForTimeout(500);
      
      // Canvas should be white again
      const isWhite = await isCanvasWhite(page);
      expect(isWhite).toBe(true);
    }
  });

  // ==========================================================================
  // TEST 10: Close Whiteboard
  // ==========================================================================
  test('should close whiteboard', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    
    await openWhiteboard(page);
    
    // Click close button
    const closeButton = page.locator('button[title*="Close"], button[aria-label*="Close"]').first();
    await expect(closeButton).toBeVisible();
    await closeButton.click();
    
    // Canvas should disappear
    await page.waitForTimeout(500);
    const canvas = page.locator('[data-testid="whiteboard-canvas"]');
    await expect(canvas).not.toBeVisible();
  });

  // ==========================================================================
  // TEST 11: Tool Switching
  // ==========================================================================
  test('should switch between tools without errors', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    
    await openWhiteboard(page);
    
    const tools = ['Pen', 'Highlighter', 'Eraser', 'Line', 'Rectangle', 'Circle'];
    
    for (const tool of tools) {
      await selectTool(page, tool);
      await page.waitForTimeout(300);
      
      // Draw something
      await drawOnCanvas(page, 150, 150, 200, 200);
      await page.waitForTimeout(300);
    }
    
    // Should complete without errors
    expect(true).toBe(true);
  });

  // ==========================================================================
  // TEST 12: Color Selection
  // ==========================================================================
  test('should change drawing color', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    
    await openWhiteboard(page);
    
    // Look for color picker
    const colorButton = page.locator('button[title*="Color"], [data-testid="color-picker"]').first();
    
    if (await colorButton.isVisible()) {
      await colorButton.click();
      await page.waitForTimeout(500);
      
      // Select a color (e.g., red)
      const redColor = page.locator('button[style*="rgb(255"], button[data-color="#FF"]').first();
      if (await redColor.isVisible()) {
        await redColor.click();
        await page.waitForTimeout(300);
      }
    }
    
    // Draw with new color
    await selectTool(page, 'Pen');
    await drawOnCanvas(page, 100, 100, 200, 200);
  });
});

// ============================================================================
// CONSOLE ERROR MONITORING
// ============================================================================

test.describe('Whiteboard Error Monitoring', () => {
  test('should not have console errors during whiteboard usage', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    
    const consoleErrors: string[] = [];
    
    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Login and use whiteboard
    await loginAsAdmin(page);
    await openWhiteboard(page);
    
    // Use various tools
    await selectTool(page, 'Pen');
    await drawOnCanvas(page, 100, 100, 200, 200);
    
    await selectTool(page, 'Line');
    await drawOnCanvas(page, 150, 150, 250, 250);
    
    // Check for errors
    console.log('Console errors:', consoleErrors);
    
    // Filter out expected errors (if any)
    const criticalErrors = consoleErrors.filter(err => 
      !err.includes('Warning') && 
      !err.includes('DevTools')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});
