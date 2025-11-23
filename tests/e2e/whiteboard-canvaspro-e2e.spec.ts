import { test, expect } from '@playwright/test';

/**
 * Comprehensive E2E tests for WhiteboardCanvasPro
 * Tests all tools with the consolidated canvas architecture
 */

test.describe('WhiteboardCanvasPro - All Tools E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/__test_whiteboard');
    await page.locator('[data-testid="whiteboard-canvas"]').waitFor({ state: 'attached', timeout: 10000 });
    
    // Wait for canvas to be ready
    await page.waitForTimeout(500);
  });

  test('1. Pen Tool - Draw freehand stroke', async ({ page }) => {
    console.log('Testing Pen Tool...');
    
    // Select pen tool
    await page.locator('[data-testid="tool-pen"]').click();
    
    // Set size
    const sizeSlider = page.locator('input[type="range"]').first();
    await sizeSlider.fill('8');
    
    // Get canvas bounds
    const canvas = page.locator('[data-testid="whiteboard-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    
    // Draw a stroke
    const startX = box!.x + box!.width * 0.3;
    const startY = box!.y + box!.height * 0.3;
    const endX = box!.x + box!.width * 0.6;
    const endY = box!.y + box!.height * 0.4;
    
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();
    
    // Verify shape was created
    const shapes = await page.evaluate(() => {
      const store = (window as any).__WB_STORE__;
      if (!store) return [];
      const shapesMap: Map<string, any> = store.getState().shapes;
      return Array.from(shapesMap.values());
    });
    
    expect(shapes.length).toBeGreaterThan(0);
    expect(shapes.some((s: any) => s.type === 'pen')).toBeTruthy();
    
    // Verify pixels were drawn
    const coloredPixels = await page.evaluate(() => {
      const canvas = document.querySelector('canvas[data-testid="whiteboard-canvas"]') as HTMLCanvasElement;
      if (!canvas) return 0;
      const ctx = canvas.getContext('2d');
      if (!ctx) return 0;
      
      const { width, height } = canvas;
      const image = ctx.getImageData(0, 0, width, height);
      let count = 0;
      
      for (let i = 0; i < image.data.length; i += 4) {
        const r = image.data[i];
        const g = image.data[i + 1];
        const b = image.data[i + 2];
        const a = image.data[i + 3];
        
        // Count non-white pixels
        if (a > 0 && !(r > 240 && g > 240 && b > 240)) {
          count++;
        }
      }
      return count;
    });
    
    expect(coloredPixels).toBeGreaterThan(500);
    console.log('✓ Pen tool working - drew stroke with', coloredPixels, 'pixels');
  });

  test('2. Highlighter Tool - Draw semi-transparent stroke', async ({ page }) => {
    console.log('Testing Highlighter Tool...');
    
    // Select highlighter
    await page.locator('[data-testid="tool-highlighter"]').click();
    
    // Set size
    const sizeSlider = page.locator('input[type="range"]').first();
    await sizeSlider.fill('12');
    
    const canvas = page.locator('[data-testid="whiteboard-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    
    // Draw horizontal stroke
    const y = box!.y + box!.height * 0.5;
    const startX = box!.x + box!.width * 0.2;
    const endX = box!.x + box!.width * 0.8;
    
    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(endX, y);
    await page.mouse.up();
    
    // Verify highlighter shape
    const shapes = await page.evaluate(() => {
      const store = (window as any).__WB_STORE__;
      if (!store) return [];
      const shapesMap: Map<string, any> = store.getState().shapes;
      return Array.from(shapesMap.values());
    });
    
    expect(shapes.some((s: any) => s.type === 'highlighter')).toBeTruthy();
    
    // Verify thick stroke (highlighter should be 4x thicker)
    const coloredPixels = await page.evaluate(() => {
      const canvas = document.querySelector('canvas[data-testid="whiteboard-canvas"]') as HTMLCanvasElement;
      if (!canvas) return 0;
      const ctx = canvas.getContext('2d');
      if (!ctx) return 0;
      
      const { width, height } = canvas;
      const stripHeight = 60;
      const yStart = Math.floor(height / 2 - stripHeight / 2);
      const image = ctx.getImageData(0, yStart, width, stripHeight);
      let count = 0;
      
      for (let i = 0; i < image.data.length; i += 4) {
        const a = image.data[i + 3];
        if (a > 0) count++;
      }
      return count;
    });
    
    expect(coloredPixels).toBeGreaterThan(2000);
    console.log('✓ Highlighter tool working - thick stroke with', coloredPixels, 'pixels');
  });

  test('3. Eraser Tool - Remove shapes', async ({ page }) => {
    console.log('Testing Eraser Tool...');
    
    // First draw something to erase
    await page.locator('[data-testid="tool-pen"]').click();
    const canvas = page.locator('[data-testid="whiteboard-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    
    const centerX = box!.x + box!.width / 2;
    const centerY = box!.y + box!.height / 2;
    
    // Draw a stroke
    await page.mouse.move(centerX - 50, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + 50, centerY);
    await page.mouse.up();
    
    // Get shape count before erasing
    const shapesBefore = await page.evaluate(() => {
      const store = (window as any).__WB_STORE__;
      return store ? (store.getState().shapes as Map<string, any>).size : 0;
    });
    
    expect(shapesBefore).toBeGreaterThan(0);
    
    // Switch to eraser
    await page.locator('[data-testid="tool-eraser"]').click();
    
    // Erase the stroke
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + 10, centerY);
    await page.mouse.up();
    
    // Verify shape was removed
    const shapesAfter = await page.evaluate(() => {
      const store = (window as any).__WB_STORE__;
      return store ? (store.getState().shapes as Map<string, any>).size : 0;
    });
    
    expect(shapesAfter).toBeLessThan(shapesBefore);
    console.log('✓ Eraser tool working - removed', shapesBefore - shapesAfter, 'shape(s)');
  });

  test('4. Rectangle Tool - Draw rectangle shape', async ({ page }) => {
    console.log('Testing Rectangle Tool...');
    
    await page.locator('[data-testid="tool-rectangle"]').click();
    
    const canvas = page.locator('[data-testid="whiteboard-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    
    // Draw rectangle
    const x1 = box!.x + box!.width * 0.3;
    const y1 = box!.y + box!.height * 0.3;
    const x2 = box!.x + box!.width * 0.6;
    const y2 = box!.y + box!.height * 0.6;
    
    await page.mouse.move(x1, y1);
    await page.mouse.down();
    await page.mouse.move(x2, y2);
    await page.mouse.up();
    
    // Verify rectangle shape
    const shapes = await page.evaluate(() => {
      const store = (window as any).__WB_STORE__;
      if (!store) return [];
      const shapesMap: Map<string, any> = store.getState().shapes;
      return Array.from(shapesMap.values());
    });
    
    const rectangle = shapes.find((s: any) => s.type === 'rectangle');
    expect(rectangle).toBeTruthy();
    expect(rectangle.points).toBeTruthy();
    expect(rectangle.points.length).toBeGreaterThanOrEqual(2);
    
    console.log('✓ Rectangle tool working - created shape with', rectangle.points.length, 'points');
  });

  test('5. Circle Tool - Draw circle shape', async ({ page }) => {
    console.log('Testing Circle Tool...');
    
    await page.locator('[data-testid="tool-circle"]').click();
    
    const canvas = page.locator('[data-testid="whiteboard-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    
    // Draw circle
    const centerX = box!.x + box!.width * 0.5;
    const centerY = box!.y + box!.height * 0.5;
    const edgeX = box!.x + box!.width * 0.7;
    const edgeY = box!.y + box!.height * 0.5;
    
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(edgeX, edgeY);
    await page.mouse.up();
    
    // Verify circle shape
    const shapes = await page.evaluate(() => {
      const store = (window as any).__WB_STORE__;
      if (!store) return [];
      const shapesMap: Map<string, any> = store.getState().shapes;
      return Array.from(shapesMap.values());
    });
    
    const circle = shapes.find((s: any) => s.type === 'circle');
    expect(circle).toBeTruthy();
    expect(circle.points).toBeTruthy();
    
    console.log('✓ Circle tool working - created shape');
  });

  test('6. Line Tool - Draw straight line', async ({ page }) => {
    console.log('Testing Line Tool...');
    
    await page.locator('[data-testid="tool-line"]').click();
    
    const canvas = page.locator('[data-testid="whiteboard-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    
    // Draw line
    const x1 = box!.x + box!.width * 0.2;
    const y1 = box!.y + box!.height * 0.7;
    const x2 = box!.x + box!.width * 0.8;
    const y2 = box!.y + box!.height * 0.3;
    
    await page.mouse.move(x1, y1);
    await page.mouse.down();
    await page.mouse.move(x2, y2);
    await page.mouse.up();
    
    // Verify line shape
    const shapes = await page.evaluate(() => {
      const store = (window as any).__WB_STORE__;
      if (!store) return [];
      const shapesMap: Map<string, any> = store.getState().shapes;
      return Array.from(shapesMap.values());
    });
    
    const line = shapes.find((s: any) => s.type === 'line');
    expect(line).toBeTruthy();
    expect(line.points).toBeTruthy();
    expect(line.points.length).toBe(2);
    
    console.log('✓ Line tool working - created line from', line.points[0], 'to', line.points[1]);
  });

  test('7. Arrow Tool - Draw arrow shape', async ({ page }) => {
    console.log('Testing Arrow Tool...');
    
    await page.locator('[data-testid="tool-arrow"]').click();
    
    const canvas = page.locator('[data-testid="whiteboard-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    
    // Draw arrow
    const x1 = box!.x + box!.width * 0.3;
    const y1 = box!.y + box!.height * 0.8;
    const x2 = box!.x + box!.width * 0.7;
    const y2 = box!.y + box!.height * 0.2;
    
    await page.mouse.move(x1, y1);
    await page.mouse.down();
    await page.mouse.move(x2, y2);
    await page.mouse.up();
    
    // Verify arrow shape
    const shapes = await page.evaluate(() => {
      const store = (window as any).__WB_STORE__;
      if (!store) return [];
      const shapesMap: Map<string, any> = store.getState().shapes;
      return Array.from(shapesMap.values());
    });
    
    const arrow = shapes.find((s: any) => s.type === 'arrow');
    expect(arrow).toBeTruthy();
    expect(arrow.points).toBeTruthy();
    
    console.log('✓ Arrow tool working - created arrow shape');
  });

  test('8. Text Tool - Add text annotation', async ({ page }) => {
    console.log('Testing Text Tool...');
    
    await page.locator('[data-testid="tool-text"]').click();
    
    // Wait for text layer to appear
    const textLayer = page.locator('[data-testid="text-layer"]');
    await expect(textLayer).toBeVisible({ timeout: 5000 });
    
    // Type text
    await textLayer.fill('Test Text');
    
    // Commit with Enter
    await page.keyboard.press('Enter');
    
    // Verify text layer is hidden
    await expect(textLayer).toBeHidden();
    
    // Verify text shape was created
    const shapes = await page.evaluate(() => {
      const store = (window as any).__WB_STORE__;
      if (!store) return [];
      const shapesMap: Map<string, any> = store.getState().shapes;
      return Array.from(shapesMap.values());
    });
    
    const textShape = shapes.find((s: any) => s.type === 'text' && s.content === 'Test Text');
    expect(textShape).toBeTruthy();
    expect(textShape.content).toBe('Test Text');
    
    console.log('✓ Text tool working - created text:', textShape.content);
  });

  test('9. Emoji Tool - Add emoji annotation', async ({ page }) => {
    console.log('Testing Emoji Tool...');
    
    // Note: Emoji tool uses prompt() which we'll need to handle
    // For now, we'll test that the tool activates
    await page.locator('[data-testid="tool-emoji"]').click();
    
    const currentTool = await page.evaluate(() => {
      const store = (window as any).__WB_STORE__;
      return store?.getState().tool;
    });
    
    expect(currentTool).toBe('emoji');
    console.log('✓ Emoji tool activated');
  });

  test('10. Undo/Redo - History management', async ({ page }) => {
    console.log('Testing Undo/Redo...');
    
    // Draw something
    await page.locator('[data-testid="tool-pen"]').click();
    const canvas = page.locator('[data-testid="whiteboard-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    
    const centerX = box!.x + box!.width / 2;
    const centerY = box!.y + box!.height / 2;
    
    await page.mouse.move(centerX - 30, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + 30, centerY);
    await page.mouse.up();
    
    const shapesAfterDraw = await page.evaluate(() => {
      const store = (window as any).__WB_STORE__;
      return store ? (store.getState().shapes as Map<string, any>).size : 0;
    });
    
    expect(shapesAfterDraw).toBeGreaterThan(0);
    
    // Undo
    await page.keyboard.press('Meta+z');
    await page.waitForTimeout(100);
    
    const shapesAfterUndo = await page.evaluate(() => {
      const store = (window as any).__WB_STORE__;
      return store ? (store.getState().shapes as Map<string, any>).size : 0;
    });
    
    expect(shapesAfterUndo).toBeLessThan(shapesAfterDraw);
    
    // Redo
    await page.keyboard.press('Meta+Shift+z');
    await page.waitForTimeout(100);
    
    const shapesAfterRedo = await page.evaluate(() => {
      const store = (window as any).__WB_STORE__;
      return store ? (store.getState().shapes as Map<string, any>).size : 0;
    });
    
    expect(shapesAfterRedo).toBe(shapesAfterDraw);
    console.log('✓ Undo/Redo working - shapes:', shapesAfterDraw, '→', shapesAfterUndo, '→', shapesAfterRedo);
  });

  test('11. DPR Support - High resolution rendering', async ({ page }) => {
    console.log('Testing DPR Support...');
    
    const dprInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas[data-testid="whiteboard-canvas"]') as HTMLCanvasElement;
      if (!canvas) return null;
      
      const dpr = window.devicePixelRatio || 1;
      const cssWidth = canvas.clientWidth;
      const cssHeight = canvas.clientHeight;
      const bufferWidth = canvas.width;
      const bufferHeight = canvas.height;
      
      return {
        dpr,
        cssWidth,
        cssHeight,
        bufferWidth,
        bufferHeight,
        ratio: bufferWidth / cssWidth
      };
    });
    
    expect(dprInfo).toBeTruthy();
    expect(dprInfo!.dpr).toBeGreaterThan(0);
    expect(dprInfo!.bufferWidth).toBeGreaterThan(dprInfo!.cssWidth * 0.9); // Allow for rounding
    expect(dprInfo!.ratio).toBeCloseTo(dprInfo!.dpr, 0.1);
    
    console.log('✓ DPR support working:', dprInfo);
  });

  test('12. Clear All - Remove all shapes', async ({ page }) => {
    console.log('Testing Clear All...');
    
    // Draw multiple shapes
    await page.locator('[data-testid="tool-pen"]').click();
    const canvas = page.locator('[data-testid="whiteboard-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    
    // Draw 3 strokes
    for (let i = 0; i < 3; i++) {
      const y = box!.y + box!.height * (0.3 + i * 0.2);
      await page.mouse.move(box!.x + box!.width * 0.2, y);
      await page.mouse.down();
      await page.mouse.move(box!.x + box!.width * 0.8, y);
      await page.mouse.up();
      await page.waitForTimeout(100);
    }
    
    const shapesBefore = await page.evaluate(() => {
      const store = (window as any).__WB_STORE__;
      return store ? (store.getState().shapes as Map<string, any>).size : 0;
    });
    
    expect(shapesBefore).toBeGreaterThanOrEqual(3);
    
    // Clear all (Ctrl+Delete or clear button)
    const clearButton = page.locator('[data-testid="clear-button"]');
    if (await clearButton.count() > 0) {
      await clearButton.click();
      
      // Confirm if there's a confirmation dialog
      const confirmButton = page.locator('button:has-text("Clear")').last();
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
      }
    }
    
    await page.waitForTimeout(200);
    
    const shapesAfter = await page.evaluate(() => {
      const store = (window as any).__WB_STORE__;
      return store ? (store.getState().shapes as Map<string, any>).size : 0;
    });
    
    expect(shapesAfter).toBe(0);
    console.log('✓ Clear all working - removed', shapesBefore, 'shapes');
  });
});

test.describe('WhiteboardCanvasPro - Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/__test_whiteboard');
    await page.locator('[data-testid="whiteboard-canvas"]').waitFor({ state: 'attached', timeout: 10000 });
    await page.waitForTimeout(500);
  });

  test('Tool switching maintains state', async ({ page }) => {
    console.log('Testing tool switching...');
    
    // Draw with pen
    await page.locator('[data-testid="tool-pen"]').click();
    const canvas = page.locator('[data-testid="whiteboard-canvas"]');
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    
    await page.mouse.move(box!.x + box!.width * 0.3, box!.y + box!.height * 0.3);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width * 0.6, box!.y + box!.height * 0.3);
    await page.mouse.up();
    
    // Switch to rectangle
    await page.locator('[data-testid="tool-rectangle"]').click();
    
    await page.mouse.move(box!.x + box!.width * 0.3, box!.y + box!.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width * 0.6, box!.y + box!.height * 0.7);
    await page.mouse.up();
    
    // Verify both shapes exist
    const shapes = await page.evaluate(() => {
      const store = (window as any).__WB_STORE__;
      if (!store) return [];
      const shapesMap: Map<string, any> = store.getState().shapes;
      return Array.from(shapesMap.values()).map((s: any) => s.type);
    });
    
    expect(shapes).toContain('pen');
    expect(shapes).toContain('rectangle');
    console.log('✓ Tool switching maintains state - shapes:', shapes);
  });

  test('Canvas resizes correctly', async ({ page }) => {
    console.log('Testing canvas resize...');
    
    const initialSize = await page.evaluate(() => {
      const canvas = document.querySelector('canvas[data-testid="whiteboard-canvas"]') as HTMLCanvasElement;
      return canvas ? { width: canvas.width, height: canvas.height } : null;
    });
    
    expect(initialSize).toBeTruthy();
    
    // Resize viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);
    
    const resizedSize = await page.evaluate(() => {
      const canvas = document.querySelector('canvas[data-testid="whiteboard-canvas"]') as HTMLCanvasElement;
      return canvas ? { width: canvas.width, height: canvas.height } : null;
    });
    
    expect(resizedSize).toBeTruthy();
    // Canvas should maintain DPR scaling
    expect(resizedSize!.width).toBeGreaterThan(0);
    expect(resizedSize!.height).toBeGreaterThan(0);
    
    console.log('✓ Canvas resize working:', initialSize, '→', resizedSize);
  });
});
