import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Visual snapshots of the non-whiteboard surfaces of the app.
 * Output: docs/snapshots/*.png
 *
 * The auth screen requires the app to boot past the Supabase env gate — provide
 * a local .env with VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (dummy values are
 * fine for rendering the UI). The /__test_* routes inject a fake session and
 * need no backend.
 */
const OUT = path.resolve('docs/snapshots');

test.describe('App surface snapshots', () => {
  test.beforeAll(() => fs.mkdirSync(OUT, { recursive: true }));

  test('auth screen', async ({ page }) => {
    await page.goto('/auth');
    // Either the real auth UI renders, or (without env) the config screen does.
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, '10-auth.png') });
  });

  test('notes editor', async ({ page }) => {
    await page.goto('/__test_notes');
    await page.locator('[data-testid="notes-view"]').waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(500);

    // Type some content into the editor for a representative shot
    const editor = page.locator('[data-testid="notes-editor"]');
    if (await editor.count()) {
      await editor.click();
      await page.keyboard.type('Trade plan\n• SPY calls above 540\n• Stop: 535\n• Target: 548');
      await page.waitForTimeout(300);
    }
    await page.screenshot({ path: path.join(OUT, '11-notes-editor.png') });
  });

  test('trading room shell', async ({ page }) => {
    await page.goto('/__test_trading/test-room');
    await page.locator('[data-testid="video-stage"]').waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, '12-trading-room.png') });

    // Toggle screenshare on to capture the shared-content tile
    const shareToggle = page.locator('[data-testid="screenshare-toggle"]');
    if (await shareToggle.count()) {
      await shareToggle.click();
      await expect(page.locator('[data-testid="screenshare-tile"]')).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(OUT, '13-trading-room-screenshare.png') });
    }
  });
});
