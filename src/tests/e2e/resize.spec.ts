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
