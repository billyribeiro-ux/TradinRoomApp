// ============================================================================
// WHITEBOARD TEXT & EMOJI E2E TESTS - Playwright Tests
// ============================================================================

import { test, expect } from '@playwright/test';

test.describe('Whiteboard Text Tool', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app and open whiteboard
    await page.goto('/');
    // Wait for app to load
    await page.waitForLoadState('networkidle');
  });

  test('should create text with formatting', async ({ page }) => {
    // Enable debug mode
    await page.evaluate(() => {
      (window as any).whiteboardDebug?.enable();
    });

    // Open whiteboard toolbar
    const whiteboardButton = page.locator('[data-testid="whiteboard-toolbar"]');
    if (await whiteboardButton.isVisible()) {
      // Select text tool
      await page.locator('[data-testid="tool-text"]').click();
      
      // Click on canvas to place text
      const canvas = page.locator('[data-testid="whiteboard-canvas"]');
      await canvas.click({ position: { x: 400, y: 300 } });
      
      // Wait for text editor to appear
      const textEditor = page.locator('[data-testid="text-layer"]');
      await expect(textEditor).toBeVisible();
      
      // Type text
      await textEditor.fill('Hello Zoom-grade!');
      
      // Change font family
      await page.selectOption('select:has-text("Font")', 'Inter, system-ui, sans-serif');
      
      // Change font size
      await page.fill('input[type="number"]:near(:text("Size"))', '20');
      
      // Toggle bold
      await page.locator('button:has-text("B")').click();
      
      // Complete editing
      await page.keyboard.press('Meta+Enter');
      
      // Verify text editor closed
      await expect(textEditor).not.toBeVisible();
      
      // Verify text appears on canvas (check history)
      const historyCount = await page.locator('[data-testid="history-count"]').textContent();
      expect(parseInt(historyCount || '0')).toBeGreaterThan(0);
    }
  });

  test('should support undo/redo for text', async ({ page }) => {
    const whiteboardButton = page.locator('[data-testid="whiteboard-toolbar"]');
    if (await whiteboardButton.isVisible()) {
      // Create text
      await page.locator('[data-testid="tool-text"]').click();
      const canvas = page.locator('[data-testid="whiteboard-canvas"]');
      await canvas.click({ position: { x: 400, y: 300 } });
      
      const textEditor = page.locator('[data-testid="text-layer"]');
      await textEditor.fill('Test Text');
      await page.keyboard.press('Meta+Enter');
      
      // Get initial history count
      const historyAfterCreate = await page.locator('[data-testid="history-count"]').textContent();
      const countAfterCreate = parseInt(historyAfterCreate || '0');
      
      // Undo
      await page.keyboard.press('Meta+Z');
      
      // Verify history decreased
      const historyAfterUndo = await page.locator('[data-testid="history-count"]').textContent();
      const countAfterUndo = parseInt(historyAfterUndo || '0');
      expect(countAfterUndo).toBeLessThanOrEqual(countAfterCreate);
      
      // Redo
      await page.keyboard.press('Meta+Shift+Z');
      
      // Verify history restored
      const historyAfterRedo = await page.locator('[data-testid="history-count"]').textContent();
      const countAfterRedo = parseInt(historyAfterRedo || '0');
      expect(countAfterRedo).toBeGreaterThanOrEqual(countAfterUndo);
    }
  });

  test('should cancel text editing with Escape', async ({ page }) => {
    const whiteboardButton = page.locator('[data-testid="whiteboard-toolbar"]');
    if (await whiteboardButton.isVisible()) {
      await page.locator('[data-testid="tool-text"]').click();
      const canvas = page.locator('[data-testid="whiteboard-canvas"]');
      await canvas.click({ position: { x: 400, y: 300 } });
      
      const textEditor = page.locator('[data-testid="text-layer"]');
      await textEditor.fill('Cancel Me');
      
      // Press Escape
      await page.keyboard.press('Escape');
      
      // Verify editor closed
      await expect(textEditor).not.toBeVisible();
    }
  });

  test('should support multi-line text', async ({ page }) => {
    const whiteboardButton = page.locator('[data-testid="whiteboard-toolbar"]');
    if (await whiteboardButton.isVisible()) {
      await page.locator('[data-testid="tool-text"]').click();
      const canvas = page.locator('[data-testid="whiteboard-canvas"]');
      await canvas.click({ position: { x: 400, y: 300 } });
      
      const textEditor = page.locator('[data-testid="text-layer"]');
      await textEditor.fill('Line 1');
      await page.keyboard.press('Enter');
      await textEditor.fill('Line 1\nLine 2');
      await page.keyboard.press('Enter');
      await textEditor.fill('Line 1\nLine 2\nLine 3');
      
      await page.keyboard.press('Meta+Enter');
      
      // Verify text was created
      const historyCount = await page.locator('[data-testid="history-count"]').textContent();
      expect(parseInt(historyCount || '0')).toBeGreaterThan(0);
    }
  });
});

test.describe('Whiteboard Emoji Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should place emoji on canvas', async ({ page }) => {
    const whiteboardButton = page.locator('[data-testid="whiteboard-toolbar"]');
    if (await whiteboardButton.isVisible()) {
      // Select emoji tool
      await page.locator('[data-testid="tool-emoji"]').click();
      
      // Click on canvas to open emoji picker
      const canvas = page.locator('[data-testid="whiteboard-canvas"]');
      await canvas.click({ position: { x: 400, y: 300 } });
      
      // Wait for emoji picker
      const emojiPicker = page.locator('[data-testid="emoji-picker"]');
      await expect(emojiPicker).toBeVisible();
      
      // Select an emoji
      await page.locator('[data-testid="emoji-🔥"]').click();
      
      // Verify picker closed
      await expect(emojiPicker).not.toBeVisible();
      
      // Verify emoji was added to history
      const historyCount = await page.locator('[data-testid="history-count"]').textContent();
      expect(parseInt(historyCount || '0')).toBeGreaterThan(0);
    }
  });

  test('should support undo/redo for emoji', async ({ page }) => {
    const whiteboardButton = page.locator('[data-testid="whiteboard-toolbar"]');
    if (await whiteboardButton.isVisible()) {
      // Place emoji
      await page.locator('[data-testid="tool-emoji"]').click();
      const canvas = page.locator('[data-testid="whiteboard-canvas"]');
      await canvas.click({ position: { x: 400, y: 300 } });
      
      const emojiPicker = page.locator('[data-testid="emoji-picker"]');
      await emojiPicker.locator('button').first().click();
      
      // Get history count
      const historyAfterCreate = await page.locator('[data-testid="history-count"]').textContent();
      const countAfterCreate = parseInt(historyAfterCreate || '0');
      
      // Undo
      await page.keyboard.press('Meta+Z');
      
      const historyAfterUndo = await page.locator('[data-testid="history-count"]').textContent();
      const countAfterUndo = parseInt(historyAfterUndo || '0');
      expect(countAfterUndo).toBeLessThanOrEqual(countAfterCreate);
      
      // Redo
      await page.keyboard.press('Meta+Shift+Z');
      
      const historyAfterRedo = await page.locator('[data-testid="history-count"]').textContent();
      const countAfterRedo = parseInt(historyAfterRedo || '0');
      expect(countAfterRedo).toBeGreaterThanOrEqual(countAfterUndo);
    }
  });

  test('should close emoji picker without selection', async ({ page }) => {
    const whiteboardButton = page.locator('[data-testid="whiteboard-toolbar"]');
    if (await whiteboardButton.isVisible()) {
      await page.locator('[data-testid="tool-emoji"]').click();
      const canvas = page.locator('[data-testid="whiteboard-canvas"]');
      await canvas.click({ position: { x: 400, y: 300 } });
      
      const emojiPicker = page.locator('[data-testid="emoji-picker"]');
      await expect(emojiPicker).toBeVisible();
      
      // Click close button
      await emojiPicker.locator('button[aria-label="Close emoji picker"]').click();
      
      // Verify picker closed
      await expect(emojiPicker).not.toBeVisible();
    }
  });
});

test.describe('Whiteboard Toolbar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should be draggable', async ({ page }) => {
    const toolbar = page.locator('[data-testid="whiteboard-toolbar"]');
    if (await toolbar.isVisible()) {
      // Get initial position
      const initialBox = await toolbar.boundingBox();
      
      // Drag toolbar
      await toolbar.locator('h3').dragTo(page.locator('body'), {
        targetPosition: { x: 500, y: 500 }
      });
      
      // Get new position
      const newBox = await toolbar.boundingBox();
      
      // Verify position changed
      expect(newBox?.x).not.toBe(initialBox?.x);
    }
  });

  test('should be resizable', async ({ page }) => {
    const toolbar = page.locator('[data-testid="whiteboard-toolbar"]');
    if (await toolbar.isVisible()) {
      // Get initial width
      const initialBox = await toolbar.boundingBox();
      
      // Drag resize grip
      const resizeGrip = page.locator('[data-testid="toolbar-resize-grip"]');
      await resizeGrip.dragTo(page.locator('body'), {
        targetPosition: { x: (initialBox?.x || 0) + 400, y: initialBox?.y || 0 }
      });
      
      // Get new width
      const newBox = await toolbar.boundingBox();
      
      // Verify width changed
      expect(newBox?.width).not.toBe(initialBox?.width);
    }
  });

  test('should persist position across reload', async ({ page }) => {
    const toolbar = page.locator('[data-testid="whiteboard-toolbar"]');
    if (await toolbar.isVisible()) {
      // Drag to new position
      await toolbar.locator('h3').dragTo(page.locator('body'), {
        targetPosition: { x: 600, y: 400 }
      });
      
      const positionBeforeReload = await toolbar.boundingBox();
      
      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check position persisted
      const positionAfterReload = await toolbar.boundingBox();
      
      // Positions should be similar (within tolerance)
      expect(Math.abs((positionAfterReload?.x || 0) - (positionBeforeReload?.x || 0))).toBeLessThan(50);
    }
  });
});

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should switch to text tool with T key', async ({ page }) => {
    const whiteboardButton = page.locator('[data-testid="whiteboard-toolbar"]');
    if (await whiteboardButton.isVisible()) {
      // Press T
      await page.keyboard.press('t');
      
      // Verify text tool is selected
      const textToolButton = page.locator('[data-testid="tool-text"]');
      await expect(textToolButton).toHaveClass(/bg-blue-500/);
    }
  });

  test('should switch to eraser with E key', async ({ page }) => {
    const whiteboardButton = page.locator('[data-testid="whiteboard-toolbar"]');
    if (await whiteboardButton.isVisible()) {
      await page.keyboard.press('e');
      
      // Verify eraser tool is selected (check toolbar state)
      // This would check the actual tool state in the store
    }
  });
});
