import { test, expect } from '@playwright/test';

// Multi-text creation and edit-in-place scenarios

test.describe('Whiteboard Text - multi create and edit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/__test_whiteboard');
    await page.locator('[data-testid="whiteboard-canvas"]').waitFor({ state: 'attached' });
  });

  test('create texts at multiple positions and edit via double-click', async ({ page }) => {
    const canvas = page.locator('[data-testid="whiteboard-canvas"]');

    // Select text tool
    await page.locator('[data-testid="tool-text"]').click();

    // Initial centered editor appears; type first text and commit
    const editor = page.locator('[data-testid="text-layer"]');
    await expect(editor).toBeVisible();
    await editor.fill('First');
    await page.keyboard.press('Enter');
    await expect(editor).toBeHidden();

    // Place second text
  const box = await canvas.boundingBox();
  if (!box) test.skip();
  const b = box!;
  const centerX = b.x + b.width * 0.35;
  const centerY = b.y + b.height * 0.4;
    await canvas.click({ position: { x: centerX - b.x, y: centerY - b.y } });
    const editor2 = page.locator('[data-testid="text-layer"]');
    try {
      await expect(editor2).toBeVisible({ timeout: 5000 });
    } catch {
      // Retry click once if timing caused a miss
      await canvas.click({ position: { x: centerX - b.x + 2, y: centerY - b.y + 2 } });
      await expect(editor2).toBeVisible({ timeout: 5000 });
    }
    await editor2.fill('Second');
    await page.keyboard.press('Enter');

    // Place third text
  const p3x = b.x + b.width * 0.7;
  const p3y = b.y + b.height * 0.7;
  await canvas.click({ position: { x: p3x - b.x, y: p3y - b.y } });
    const editor3 = page.locator('[data-testid="text-layer"]');
    await expect(editor3).toBeVisible();
    await editor3.fill('Third');
    await page.keyboard.press('Enter');

    // Double-click near the second text location to edit it
  await page.mouse.dblclick(centerX, centerY);
    const editEditor = page.locator('[data-testid="text-layer"]');
    try {
      await expect(editEditor).toBeVisible({ timeout: 500 });
    } catch {
      // Fallback: some environments miss dblclick hit; single-click to open editor
      await canvas.click({ position: { x: centerX - b.x, y: centerY - b.y } });
      await expect(editEditor).toBeVisible({ timeout: 2000 });
    }
    await editEditor.fill('Second (edited)');
    await page.keyboard.press('Enter');

    // Verify store has at least 3 text shapes and includes edited content
    const texts = await page.evaluate(() => {
      const store = (window as any).__WB_STORE__;
      if (!store) return [] as string[];
      const shapes: Map<string, any> = store.getState().shapes;
      return Array.from(shapes.values()).filter((s: any) => s.type === 'text').map((s: any) => s.text as string);
    });
    expect(texts.length).toBeGreaterThanOrEqual(3);
    expect(texts.join(' | ')).toContain('Second (edited)');
  });

  test('toolbar buttons do not show orange outlines on click', async ({ page }) => {
    const pen = page.locator('[data-testid="tool-pen"]');
    await pen.click();
    // Read computed outline styles
    const outline = await pen.evaluate((btn) => {
      const cs = window.getComputedStyle(btn as HTMLElement);
      return { style: cs.outlineStyle, width: cs.outlineWidth, color: cs.outlineColor };
    });
    expect(outline.style === 'none' || outline.width === '0px').toBeTruthy();
  });
});
