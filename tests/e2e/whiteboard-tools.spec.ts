import { test, expect } from '@playwright/test';

// Deterministic whiteboard tests using the test route and injected session

test.describe('Whiteboard core tools', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/__test_whiteboard');
    await page.locator('[data-testid="whiteboard-canvas"]').waitFor({ state: 'attached' });
  });

  test('Text tool: click to create, type, and commit', async ({ page }) => {
    await page.locator('[data-testid="tool-text"]').click();

    // Editor should appear automatically when selecting the text tool
    const overlay = page.locator('[data-testid="text-layer"]');
    await expect(overlay).toBeVisible();

    await overlay.fill('Hello Whiteboard');
    // Commit with Enter
    await page.keyboard.press('Enter');
    await expect(overlay).toBeHidden();

    // History should increase
    const historyCountText = await page.locator('[data-testid="history-count"]').textContent();
    const count = parseInt(historyCountText || '0', 10);
    expect(count).toBeGreaterThan(1);
  });

  test('Highlighter draws a thick stroke (not a thin line)', async ({ page }) => {
    // Bump base size to make thickness even larger
    // Use toolbar size slider
    const sizeLabel = page.locator('text=Size:');
    if (!(await sizeLabel.count())) test.skip();

    // Select highlighter tool
    await page.locator('[data-testid="tool-highlighter"]').click();

    // Increase size via range input (set to ~12)
    const sizeSlider = page.locator('input[type="range"]');
    await sizeSlider.fill('12');

    const canvas = page.locator('[data-testid="whiteboard-canvas"]');
  const box = await canvas.boundingBox();
  if (!box) test.skip();
  const b = box!;

    // Draw a short horizontal stroke near center
  const startX = b.x + b.width / 2 - 60;
  const y = b.y + b.height / 2;
    const endX = startX + 120;

    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(endX, y);
    await page.mouse.up();

    // Verify there are many colored pixels around the stroke midline (thickness)
    const coloredPixels = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return 0;
      const ctx = canvas.getContext('2d');
      if (!ctx) return 0;
      const { width, height } = canvas;
      // Sample a 40px tall strip across the center of the canvas
      const stripHeight = 40; // pixels
      const yStart = Math.floor(height / 2 - stripHeight / 2);
      const image = ctx.getImageData(0, yStart, width, stripHeight);
      let count = 0;
      for (let i = 0; i < image.data.length; i += 4) {
        const r = image.data[i];
        const g = image.data[i + 1];
        const b = image.data[i + 2];
        const a = image.data[i + 3];
        // Count non-white-ish and non-transparent pixels
        if (a > 0 && !(r > 240 && g > 240 && b > 240)) count++;
      }
      return count;
    });

    // With a thick highlighter we expect a sizeable number of colored pixels
    expect(coloredPixels).toBeGreaterThan(2000);
  });

  test('Pen draws a visible stroke', async ({ page }) => {
    await page.locator('[data-testid="tool-pen"]').click();
    const sizeSlider = page.locator('input[type="range"]');
    await sizeSlider.fill('8');

    const canvas = page.locator('[data-testid="whiteboard-canvas"]');
    const box = await canvas.boundingBox();
    if (!box) test.skip();
    const b = box!;

    const startX = b.x + b.width / 2 - 80;
    const y = b.y + b.height / 2 - 40;
    const endX = startX + 160;

    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(endX, y);
    await page.mouse.up();

    const coloredPixels = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return 0;
      const ctx = canvas.getContext('2d');
      if (!ctx) return 0;
      const { width, height } = canvas;
      const stripHeight = 30;
      const yStart = Math.floor(height / 2 - 40 - stripHeight / 2);
      const image = ctx.getImageData(0, yStart, width, stripHeight);
      let count = 0;
      for (let i = 0; i < image.data.length; i += 4) {
        const r = image.data[i];
        const g = image.data[i + 1];
        const b = image.data[i + 2];
        const a = image.data[i + 3];
        if (a > 0 && !(r > 240 && g > 240 && b > 240)) count++;
      }
      return count;
    });

    expect(coloredPixels).toBeGreaterThan(800);
  });

  test('Eraser removes existing stroke', async ({ page }) => {
    // Draw with pen first
    await page.locator('[data-testid="tool-pen"]').click();
    const sizeSlider = page.locator('input[type="range"]');
    await sizeSlider.fill('10');

    const canvas = page.locator('[data-testid="whiteboard-canvas"]');
    const box = await canvas.boundingBox();
    if (!box) test.skip();
    const b = box!;

    const startX = b.x + b.width / 2 - 120;
    const y = b.y + b.height / 2 + 40;
    const endX = startX + 240;

    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(endX, y);
    await page.mouse.up();

    const pixelsBefore = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return 0;
      const ctx = canvas.getContext('2d');
      if (!ctx) return 0;
      const { width, height } = canvas;
      const stripHeight = 30;
      const yStart = Math.floor(height / 2 + 40 - stripHeight / 2);
      const image = ctx.getImageData(0, yStart, width, stripHeight);
      let count = 0;
      for (let i = 0; i < image.data.length; i += 4) {
        const r = image.data[i];
        const g = image.data[i + 1];
        const b = image.data[i + 2];
        const a = image.data[i + 3];
        if (a > 0 && !(r > 240 && g > 240 && b > 240)) count++;
      }
      return count;
    });

    // Erase across the stroke
    await page.locator('[data-testid="tool-eraser"]').click();
    // Stroke eraser deletes shapes when intersected; drag across center
    const eraseStartX = b.x + b.width / 2 - 40;
    const eraseEndX = b.x + b.width / 2 + 40;
    await page.mouse.move(eraseStartX, y);
    await page.mouse.down();
    await page.mouse.move(eraseEndX, y);
    await page.mouse.up();

    const pixelsAfter = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return 0;
      const ctx = canvas.getContext('2d');
      if (!ctx) return 0;
      const { width, height } = canvas;
      const stripHeight = 30;
      const yStart = Math.floor(height / 2 + 40 - stripHeight / 2);
      const image = ctx.getImageData(0, yStart, width, stripHeight);
      let count = 0;
      for (let i = 0; i < image.data.length; i += 4) {
        const r = image.data[i];
        const g = image.data[i + 1];
        const b = image.data[i + 2];
        const a = image.data[i + 3];
        if (a > 0 && !(r > 240 && g > 240 && b > 240)) count++;
      }
      return count;
    });

    expect(pixelsAfter).toBeLessThan(pixelsBefore / 2);
  });

  test('Line tool creates a shape in store', async ({ page }) => {
    await page.locator('[data-testid="tool-line"]').click();
    const canvas = page.locator('[data-testid="whiteboard-canvas"]');
    const box = await canvas.boundingBox();
    if (!box) test.skip();
    const b = box!;
    const x1 = b.x + b.width * 0.3;
    const y1 = b.y + b.height * 0.3;
    const x2 = b.x + b.width * 0.7;
    const y2 = b.y + b.height * 0.6;
    await page.mouse.move(x1, y1);
    await page.mouse.down();
    await page.mouse.move(x2, y2);
    await page.mouse.up();

    const types = await page.evaluate(() => {
      const store = (window as any).__WB_STORE__;
      if (!store) return [] as string[];
      const shapes: Map<string, any> = store.getState().shapes;
      return Array.from(shapes.values()).map((s: any) => s.type);
    });
    expect(types).toContain('line');
  });

  test('Rectangle tool creates a shape in store', async ({ page }) => {
    await page.locator('[data-testid="tool-rectangle"]').click();
    // Verify tool actually switched to rectangle
    const currentTool = await page.evaluate(() => {
      const store = (window as any).__WB_STORE__;
      return store?.getState().tool as string;
    });
    expect(currentTool).toBe('rectangle');
    const canvas = page.locator('[data-testid="whiteboard-canvas"]');
    const box = await canvas.boundingBox();
    if (!box) test.skip();
    const b = box!;
  // Draw away from the toolbar (top-left) to avoid pointer interception
  const x1 = b.x + b.width * 0.65;
  const y1 = b.y + b.height * 0.65;
  const x2 = b.x + b.width * 0.9;
  const y2 = b.y + b.height * 0.9;
    await page.mouse.move(x1, y1);
    await page.mouse.down();
    await page.mouse.move(x2, y2);
    await page.mouse.up();

    // Debug captures from the app for this flaky path
    const debugLastAdded = await page.evaluate(() => (window as any).__WB_DEBUG_LAST_ADDED__);
    const debugLastUpdated = await page.evaluate(() => (window as any).__WB_DEBUG_LAST_UPDATED__);
    const debugUp = await page.evaluate(() => (window as any).__WB_DEBUG_UP__);
    const debugTool = await page.evaluate(() => (window as any).__WB_DEBUG_TOOL__);
    const debugBranch = await page.evaluate(() => (window as any).__WB_DEBUG_BRANCH__);
    const debugOnDown = await page.evaluate(() => (window as any).__WB_DEBUG_ON_DOWN__);
    const debugOnMove = await page.evaluate(() => (window as any).__WB_DEBUG_ON_MOVE__);
    const debugOnUp = await page.evaluate(() => (window as any).__WB_DEBUG_ON_UP__);
    const shapesSize = await page.evaluate(() => {
      const store = (window as any).__WB_STORE__;
      return store ? (store.getState().shapes as Map<string, any>).size : -1;
    });
    expect.soft(shapesSize).toBeGreaterThanOrEqual(1);
    expect.soft(debugLastAdded?.type).toBe('rectangle');
    expect.soft(typeof debugLastUpdated?.len).toBe('number');
    expect.soft(debugUp === true).toBeTruthy();
    expect.soft(debugTool).toBe('rectangle');
    // We expect the generic branch for shapes handled by usePointerDrawing
    expect.soft(typeof debugBranch).toBe('string');
    expect.soft(debugOnDown === true).toBeTruthy();
    expect.soft(typeof debugOnMove).toBe('string');
    expect.soft(typeof debugOnUp).toBe('string');

    const types = await page.evaluate(() => {
      const store = (window as any).__WB_STORE__;
      if (!store) return [] as string[];
      const shapes: Map<string, any> = store.getState().shapes;
      return Array.from(shapes.values()).map((s: any) => s.type);
    });
    expect(types).toContain('rectangle');
  });

  test('Circle tool creates a shape in store', async ({ page }) => {
    await page.locator('[data-testid="tool-circle"]').click();
    const canvas = page.locator('[data-testid="whiteboard-canvas"]');
    const box = await canvas.boundingBox();
    if (!box) test.skip();
    const b = box!;
    const x1 = b.x + b.width * 0.6;
    const y1 = b.y + b.height * 0.3;
    const x2 = b.x + b.width * 0.8;
    const y2 = b.y + b.height * 0.5;
    await page.mouse.move(x1, y1);
    await page.mouse.down();
    await page.mouse.move(x2, y2);
    await page.mouse.up();

    const types = await page.evaluate(() => {
      const store = (window as any).__WB_STORE__;
      if (!store) return [] as string[];
      const shapes: Map<string, any> = store.getState().shapes;
      return Array.from(shapes.values()).map((s: any) => s.type);
    });
    expect(types).toContain('circle');
  });

  test('Arrow tool creates a shape in store', async ({ page }) => {
    await page.locator('[data-testid="tool-arrow"]').click();
    const canvas = page.locator('[data-testid="whiteboard-canvas"]');
    const box = await canvas.boundingBox();
    if (!box) test.skip();
    const b = box!;
    const x1 = b.x + b.width * 0.4;
    const y1 = b.y + b.height * 0.7;
    const x2 = b.x + b.width * 0.75;
    const y2 = b.y + b.height * 0.75;
    await page.mouse.move(x1, y1);
    await page.mouse.down();
    await page.mouse.move(x2, y2);
    await page.mouse.up();

    const types = await page.evaluate(() => {
      const store = (window as any).__WB_STORE__;
      if (!store) return [] as string[];
      const shapes: Map<string, any> = store.getState().shapes;
      return Array.from(shapes.values()).map((s: any) => s.type);
    });
    expect(types).toContain('arrow');
  });
});
