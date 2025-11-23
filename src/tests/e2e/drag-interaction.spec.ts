import { test, expect } from '@playwright/test';

test('left panel resize is smooth and respects clamps', async ({ page }) => {
  await page.goto('/');
  // Wait for room loaded marker
  await page.getByTestId('alerts-list').or(page.getByTestId('alerts-empty')).waitFor();

  // Select the vertical handle (left ↔ main). Adjust selector to your handle element:
  const handle = page.locator('[data-trading-room] aside [class*="cursor-col-resize"]').first();

  // Read initial width
  const aside = page.locator('[data-trading-room] aside').first();
  const before = await aside.evaluate((el) => parseInt(getComputedStyle(el).width, 10));

  // Drag to the right by 200px
  const box = await handle.boundingBox();
  if (!box) throw new Error('Handle not found');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 200, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();

  // Width should increase and not exceed clamp
  const after = await aside.evaluate((el) => parseInt(getComputedStyle(el).width, 10));
  expect(after).toBeGreaterThan(before);
  expect(after).toBeLessThanOrEqual(Math.max(800, Math.floor(window.innerWidth * 0.6)));
});

test('alerts/chat horizontal handle drags without jump', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('alerts-list').or(page.getByTestId('alerts-empty')).waitFor();

  const alerts = page.locator('[aria-label="Trading Alerts"]');
  const handle = alerts.locator('xpath=following-sibling::*[contains(@class,"cursor-row-resize")]').first();

  const before = await alerts.evaluate((el) => parseInt(getComputedStyle(el).height, 10));

  const box = await handle.boundingBox();
  if (!box) throw new Error('Horizontal handle not found');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 120, { steps: 10 });
  await page.mouse.up();

  const after = await alerts.evaluate((el) => parseInt(getComputedStyle(el).height, 10));
  expect(after).toBeGreaterThan(before);
  // sanity: within 15%-60% window of viewport
  const vp = await page.evaluate(() => window.innerHeight);
  expect(after).toBeGreaterThanOrEqual(Math.max(120, Math.floor(vp * 0.15)));
  expect(after).toBeLessThanOrEqual(Math.floor(vp * 0.6));
});

test('drag prevents text selection', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('alerts-list').or(page.getByTestId('alerts-empty')).waitFor();
  
  // Start drag on resize handle
  const handle = page.locator('[data-trading-room] aside [class*="cursor-col-resize"]').first();
  const box = await handle.boundingBox();
  if (!box) throw new Error('Handle not found');
  
  // Move to handle and start drag
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  
  // Try to select text while dragging (should not work)
  await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2);
  await page.keyboard.press('Shift+Home');
  
  // Check if any text is selected
  const selection = await page.evaluate(() => window.getSelection()?.toString());
  expect(selection || '').toBe('');
  
  // End drag
  await page.mouse.up();
});

test('rapid mouseleave cleans up properly', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('alerts-list').or(page.getByTestId('alerts-empty')).waitFor();

  // Check initial body styles
  const initialCursor = await page.evaluate(() => getComputedStyle(document.body).cursor);
  const initialUserSelect = await page.evaluate(() => getComputedStyle(document.body).userSelect);
  
  // Start drag
  const handle = page.locator('[data-trading-room] aside [class*="cursor-col-resize"]').first();
  const box = await handle.boundingBox();
  if (!box) throw new Error('Handle not found');
  
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  
  // Verify drag styles are applied
  const dragCursor = await page.evaluate(() => getComputedStyle(document.body).cursor);
  const dragUserSelect = await page.evaluate(() => getComputedStyle(document.body).userSelect);
  expect(dragCursor).toBe('col-resize');
  expect(dragUserSelect).toBe('none');
  
  // Move mouse out of window (simulate mouseleave)
  await page.mouse.move(-10, -10);
  
  // Wait a bit for cleanup
  await page.waitForTimeout(100);
  
  // Verify styles are reset after mouseleave
  const finalCursor = await page.evaluate(() => getComputedStyle(document.body).cursor);
  const finalUserSelect = await page.evaluate(() => getComputedStyle(document.body).userSelect);
  expect(finalCursor).toBe(initialCursor);
  expect(finalUserSelect).toBe(initialUserSelect);
});

test('camera window drag prevents text selection', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('alerts-list').or(page.getByTestId('alerts-empty')).waitFor();

  // Open camera window (if not already open)
  const cameraButton = page.locator('[title*="Camera"]').first();
  if (await cameraButton.isVisible()) {
    await cameraButton.click();
  }

  // Wait for camera window
  const cameraWindow = page.locator('.fixed.z-50.bg-slate-900').filter({ hasText: 'Your Camera' });
  await cameraWindow.waitFor({ timeout: 5000 });

  // Get initial selection
  const initialSelection = await page.evaluate(() => window.getSelection()?.toString() || '');

  // Start dragging camera window from header (not buttons)
  const header = cameraWindow.locator('.bg-slate-800').first();
  const box = await header.boundingBox();
  if (!box) throw new Error('Camera header not found');
  
  await page.mouse.move(box.x + 50, box.y + box.height / 2);
  await page.mouse.down();
  
  // Move and try to select text
  await page.mouse.move(box.x + 100, box.y + 50);
  await page.keyboard.press('Shift+Home');
  
  // Check selection hasn't changed
  const dragSelection = await page.evaluate(() => window.getSelection()?.toString() || '');
  expect(dragSelection).toBe(initialSelection);
  
  // End drag
  await page.mouse.up();
});
