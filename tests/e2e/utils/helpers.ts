/**
 * E2E Test Helper Utilities
 */

import type { Page, Locator} from '@playwright/test';
import { expect } from '@playwright/test';

export interface Size {
  w: number;
  h: number;
}

export async function getSize(element: Locator): Promise<Size> {
  const box = await element.boundingBox();
  if (!box) {
    throw new Error('Element not visible or has no bounding box');
  }
  return { w: box.width, h: box.height };
}

export function expectClamp(value: number, min: number, max: number, tolerance = 1) {
  expect(value).toBeGreaterThanOrEqual(min - tolerance);
  expect(value).toBeLessThanOrEqual(max + tolerance);
}

export async function waitForStableSize(
  element: Locator,
  maxAttempts = 10,
  stableThreshold = 1
): Promise<Size> {
  let lastSize: Size | null = null;
  let stableCount = 0;

  for (let i = 0; i < maxAttempts; i++) {
    await element.page().waitForTimeout(16); // ~1 frame
    const currentSize = await getSize(element);

    if (lastSize) {
      const deltaW = Math.abs(currentSize.w - lastSize.w);
      const deltaH = Math.abs(currentSize.h - lastSize.h);

      if (deltaW <= stableThreshold && deltaH <= stableThreshold) {
        stableCount++;
        if (stableCount >= 2) {
          return currentSize;
        }
      } else {
        stableCount = 0;
      }
    }

    lastSize = currentSize;
  }

  throw new Error('Element size did not stabilize');
}

export async function detectFlicker(
  element: Locator,
  dragFn: () => Promise<void>,
  maxFlicker = 4
): Promise<void> {
  const sizes: number[] = [];
  let isDragging = true;

  // Start monitoring
  const monitor = async () => {
    while (isDragging) {
      try {
        const size = await getSize(element);
        sizes.push(size.h || size.w);
      } catch {
        // Element might be temporarily unavailable
      }
      await element.page().waitForTimeout(16);
    }
  };

  const monitorPromise = monitor();

  // Perform drag
  await dragFn();
  isDragging = false;
  await monitorPromise;

  // Check for flicker
  for (let i = 1; i < sizes.length; i++) {
    const delta = Math.abs(sizes[i] - sizes[i - 1]);
    if (delta > maxFlicker && delta < 100) {
      // Ignore large intentional moves
      throw new Error(`Flicker detected: ${delta}px change between frames`);
    }
  }
}

export async function assertBodyStylesReset(page: Page) {
  const cursor = await page.evaluate(() => document.body.style.cursor);
  const userSelect = await page.evaluate(() => document.body.style.userSelect);
  const touchAction = await page.evaluate(() => document.body.style.touchAction);

  expect(cursor).toBe('');
  expect(userSelect).toBe('');
  expect(touchAction).toBe('');
}

export async function dragElement(
  element: Locator,
  deltaX: number,
  deltaY: number
): Promise<void> {
  const box = await element.boundingBox();
  if (!box) throw new Error('Element not found');

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  await element.page().mouse.move(startX, startY);
  await element.page().mouse.down();
  await element.page().mouse.move(startX + deltaX, startY + deltaY, { steps: 10 });
  await element.page().mouse.up();
}

export async function touchDrag(
  page: Page,
  element: Locator,
  deltaX: number,
  deltaY: number
): Promise<void> {
  const box = await element.boundingBox();
  if (!box) throw new Error('Element not found');

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  await page.touchscreen.tap(startX, startY);
  await page.waitForTimeout(50);
  
  // Simulate touch drag
  await page.evaluate(
    ({ x, y, dx, dy }) => {
      const el = document.elementFromPoint(x, y);
      if (!el) return;

      const touchStart = new TouchEvent('touchstart', {
        touches: [new Touch({ identifier: 0, target: el, clientX: x, clientY: y })],
        bubbles: true,
        cancelable: true,
      });
      el.dispatchEvent(touchStart);

      const touchMove = new TouchEvent('touchmove', {
        touches: [new Touch({ identifier: 0, target: el, clientX: x + dx, clientY: y + dy })],
        bubbles: true,
        cancelable: true,
      });
      el.dispatchEvent(touchMove);

      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [new Touch({ identifier: 0, target: el, clientX: x + dx, clientY: y + dy })],
        bubbles: true,
        cancelable: true,
      });
      el.dispatchEvent(touchEnd);
    },
    { x: startX, y: startY, dx: deltaX, dy: deltaY }
  );
}
