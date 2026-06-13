import { test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Generates visual snapshots of the whiteboard drawing tools in action.
 * Output: docs/snapshots/*.png
 *
 * Run with: npx playwright test tests/e2e/whiteboard-snapshots.spec.ts --project=chromium
 */
const OUT = path.resolve('docs/snapshots');

test.describe('Whiteboard tool snapshots', () => {
  test.beforeAll(() => fs.mkdirSync(OUT, { recursive: true }));

  test('capture drawing tool snapshots', async ({ page }) => {
    await page.goto('/__test_whiteboard');
    await page.locator('[data-testid="whiteboard-canvas"]').waitFor({ state: 'attached', timeout: 15000 });
    await page.waitForTimeout(700);

    const canvas = page.locator('[data-testid="whiteboard-canvas"]');
    const box = (await canvas.boundingBox())!;
    // Fractional coordinate → absolute page point (kept clear of the left toolbar).
    const at = (fx: number, fy: number) => ({ x: box.x + box.width * fx, y: box.y + box.height * fy });

    const freehand = async (pts: Array<[number, number]>) => {
      const p0 = at(pts[0][0], pts[0][1]);
      await page.mouse.move(p0.x, p0.y);
      await page.mouse.down();
      for (let i = 1; i < pts.length; i++) {
        const p = at(pts[i][0], pts[i][1]);
        await page.mouse.move(p.x, p.y, { steps: 8 });
      }
      await page.mouse.up();
      await page.waitForTimeout(120);
    };

    // The whiteboard canvas is dark, so pick bright, distinct colours per tool.
    const setColor = (hex: string) =>
      page.evaluate((c) => (window as Window & { __WB_STORE__?: { getState(): { setColor(c: string): void } } }).__WB_STORE__?.getState().setColor(c), hex);
    const setSize = (n: number) =>
      page.evaluate((s) => (window as Window & { __WB_STORE__?: { getState(): { setSize(n: number): void } } }).__WB_STORE__?.getState().setSize(s), n);

    const dragShape = async (tool: string, color: string, a: [number, number], b: [number, number]) => {
      await page.locator(`[data-testid="tool-${tool}"]`).click();
      await setColor(color);
      const p1 = at(a[0], a[1]);
      const p2 = at(b[0], b[1]);
      await page.mouse.move(p1.x, p1.y);
      await page.mouse.down();
      await page.mouse.move(p2.x, p2.y, { steps: 14 });
      await page.mouse.up();
      await page.waitForTimeout(120);
    };

    // 1. Empty board (toolbar + canvas)
    await page.screenshot({ path: path.join(OUT, '01-whiteboard-toolbar.png') });

    // 2. Pen — freehand squiggle (sky blue)
    await page.locator('[data-testid="tool-pen"]').click();
    await setColor('#38bdf8');
    await setSize(5);
    await freehand([[0.40, 0.30], [0.45, 0.24], [0.50, 0.32], [0.55, 0.24], [0.60, 0.32], [0.65, 0.26]]);
    await page.screenshot({ path: path.join(OUT, '02-pen.png') });

    // 3. Highlighter — translucent band (yellow)
    await page.locator('[data-testid="tool-highlighter"]').click();
    await setColor('#fde047');
    await freehand([[0.40, 0.45], [0.50, 0.45], [0.60, 0.45], [0.70, 0.45]]);
    await page.screenshot({ path: path.join(OUT, '03-highlighter.png') });

    // 4. Shapes — rectangle, circle, line, arrow (distinct colours)
    await dragShape('rectangle', '#22c55e', [0.40, 0.55], [0.52, 0.68]);
    await dragShape('circle', '#a855f7', [0.58, 0.55], [0.70, 0.68]);
    await dragShape('line', '#f97316', [0.40, 0.80], [0.70, 0.86]);
    await dragShape('arrow', '#ef4444', [0.45, 0.22], [0.62, 0.18]);
    await page.screenshot({ path: path.join(OUT, '04-shapes.png') });

    // 5. Text annotation (white)
    await page.locator('[data-testid="tool-text"]').click();
    await setColor('#ffffff');
    const t = at(0.45, 0.38);
    await page.mouse.click(t.x, t.y);
    await page.locator('[data-testid="text-layer"] textarea').fill('Trading Room');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(OUT, '05-text.png') });

    // 6. Emoji picker
    await page.locator('[data-testid="tool-emoji"]').click();
    const e = at(0.6, 0.4);
    await page.mouse.click(e.x, e.y);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, '06-emoji-picker.png') });

    // 7. Final composition (all tools), back on pen
    await page.keyboard.press('Escape').catch(() => {});
    await page.locator('[data-testid="tool-pen"]').click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(OUT, '07-all-tools.png') });
  });

  test('default ink color is visible on the dark board', async ({ page }) => {
    await page.goto('/__test_whiteboard');
    await page.locator('[data-testid="whiteboard-canvas"]').waitFor({ state: 'attached', timeout: 15000 });
    await page.waitForTimeout(600);

    const box = (await page.locator('[data-testid="whiteboard-canvas"]').boundingBox())!;
    const at = (fx: number, fy: number) => ({ x: box.x + box.width * fx, y: box.y + box.height * fy });

    // Draw with the DEFAULT pen color (no setColor call). It should be visible
    // (white) on the dark canvas now that the default is no longer black.
    await page.locator('[data-testid="tool-pen"]').click();
    const pts: Array<[number, number]> = [[0.40, 0.35], [0.48, 0.30], [0.56, 0.40], [0.64, 0.30], [0.72, 0.38]];
    const p0 = at(pts[0][0], pts[0][1]);
    await page.mouse.move(p0.x, p0.y);
    await page.mouse.down();
    for (let i = 1; i < pts.length; i++) {
      const p = at(pts[i][0], pts[i][1]);
      await page.mouse.move(p.x, p.y, { steps: 8 });
    }
    await page.mouse.up();
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(OUT, '00-default-ink-visible.png') });
  });
});
