import { test, expect } from '@playwright/test';

// E2E: Ensure editor typing remains LTR and pasted RTL does not flip layout
// Assumes NotesView is reachable at a route (adjust path if needed)
// We use the shared fixture to load the app and land in the trading room.

test.describe('Editor Bidi / LTR Enforcement', () => {
  test('typing stays LTR after pasting RTL HTML', async ({ page }) => {
    // Navigate directly to isolated test route (dev only)
    await page.goto('/__test_notes');
    await page.waitForLoadState('domcontentloaded');

    // Ensure NotesView loaded
    await expect(page.locator('[data-testid="notes-view"]')).toBeVisible({ timeout: 10000 });
    const editor = page.locator('[data-testid="notes-editor"]');
    await expect(editor).toBeVisible({ timeout: 10000 }).catch(async () => {
      console.log('[E2E] notes-editor not visible. Page HTML snippet:', (await page.content()).slice(0, 2000));
      throw new Error('notes-editor not visible');
    });

    // Initial type
    await editor.click();
    await editor.type('Hello world ');

    // Simulate paste of RTL markup via actual paste event (triggers sanitization)
    await page.evaluate(() => {
      const editorEl = document.querySelector('#notes-editor');
      if (!editorEl) return;
      const dt = new DataTransfer();
      dt.setData('text/html', '<div dir="rtl" style="direction:rtl;unicode-bidi:bidi-override">مرحبا</div>');
      const evt = new ClipboardEvent('paste', { clipboardData: dt } as any);
      editorEl.dispatchEvent(evt);
    });

    // After insertion, ensure computed direction is LTR
  const direction = await editor.evaluate((el: HTMLElement) => getComputedStyle(el).direction);
    expect(direction).toBe('ltr');

    // Append more text and confirm logical ordering remains LTR
    await editor.type('continuation');
    // Use innerText for logical text sequence rather than innerHTML markup ordering
    const logical = await editor.evaluate(el => (el as HTMLElement).innerText);
    // We expect the English phrase we typed to appear in logical order
    expect(logical).toMatch(/Hello world/);
    // Ensure we did not accidentally get reversed English tokens (simple heuristic)
    const hasReversed = /(dlrow\s+olleH|olleH|dlrow)/.test(logical);
    expect(hasReversed).toBeFalsy();
    // Arabic text may appear; ensure no residual RTL dir attributes in markup
    const html = await editor.innerHTML();
    expect(html).not.toMatch(/dir="rtl"/);
  });
});
