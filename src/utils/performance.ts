// ============================================================================
// PERFORMANCE UTILITIES - RAF Batching & Viewport Caching
// ============================================================================
// Eliminates getBoundingClientRect() spam and batches pointer updates
// ============================================================================

import type { ViewportState } from '../features/whiteboard/types';

// =============================================================================
// VIEWPORT CACHE - Eliminates getBoundingClientRect() spam
// =============================================================================

interface CachedViewport {
  rect: DOMRect;
  viewportState: ViewportState;
  timestamp: number;
}

class ViewportCache {
  private cache = new WeakMap<HTMLElement, CachedViewport>();
  private readonly CACHE_DURATION_MS = 16; // ~1 frame @ 60fps

  /**
   * Get cached viewport data or compute fresh if stale
   * Returns both rect (for pointer calculations) and viewportState
   */
  get(
    element: HTMLElement,
    viewport: ViewportState
  ): { rect: DOMRect; viewportState: ViewportState } {
    const cached = this.cache.get(element);
    const now = performance.now();

    // Return cached if fresh (< 16ms old)
    if (cached && now - cached.timestamp < this.CACHE_DURATION_MS) {
      return {
        rect: cached.rect,
        viewportState: cached.viewportState,
      };
    }

    // Compute fresh
    const rect = element.getBoundingClientRect();
    const viewportState: ViewportState = {
      zoom: viewport.zoom,
      panX: viewport.panX,
      panY: viewport.panY,
      width: rect.width,
      height: rect.height,
      x: viewport.panX,
      y: viewport.panY,
      scale: viewport.zoom,
    };

    this.cache.set(element, {
      rect,
      viewportState,
      timestamp: now,
    });

    return { rect, viewportState };
  }

  /**
   * Invalidate cache for element (call on resize)
   */
  invalidate(element: HTMLElement): void {
    this.cache.delete(element);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache = new WeakMap();
  }
}

// =============================================================================
// POINTER BATCHER - RAF-based update batching
// =============================================================================

class PointerBatcher {
  private rafId: number | null = null;
  private pendingCallback: (() => void) | null = null;

  /**
   * Schedule a callback to run on next RAF
   * If already scheduled, replaces the pending callback (batching behavior)
   */
  scheduleUpdate(callback: () => void): void {
    this.pendingCallback = callback;

    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        if (this.pendingCallback) {
          this.pendingCallback();
        }
        this.rafId = null;
        this.pendingCallback = null;
      });
    }
  }

  /**
   * Cancel pending RAF callback and execute immediately if one exists
   */
  cancel(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    // Execute immediately to ensure final state is committed
    if (this.pendingCallback) {
      this.pendingCallback();
      this.pendingCallback = null;
    }
  }
}

// =============================================================================
// VIEWPORT HELPERS
// =============================================================================

/**
 * Convert ViewportTransform to ViewportState by adding CSS dimensions from element
 * This respects DPR as SSOT - dimensions are in CSS pixels, not device pixels
 */
export function toViewportState(
  viewport: { panX: number; panY: number; zoom: number },
  element: HTMLElement
): ViewportState {
  const rect = element.getBoundingClientRect();
  return {
    ...viewport,
    width: rect.width,   // CSS pixels
    height: rect.height, // CSS pixels
    x: viewport.panX,
    y: viewport.panY,
    scale: viewport.zoom,
  };
}

// =============================================================================
// PATH SIMPLIFICATION UTILITIES
// =============================================================================

type Point2D = { x: number; y: number };

/**
 * Squared perpendicular distance from point `p` to the segment `[a, b]`.
 * This is the metric the Ramer–Douglas–Peucker algorithm actually requires;
 * the previous implementation summed the distances to the two endpoints, which
 * is not the perpendicular distance and caused the routine to (a) almost never
 * simplify and (b) recurse to a depth of O(n), overflowing the stack on large
 * paths. Clamping `t` to [0, 1] also handles degenerate (zero-length) segments.
 */
function getSqSegDist(p: Point2D, a: Point2D, b: Point2D): number {
  let x = a.x;
  let y = a.y;
  let dx = b.x - x;
  let dy = b.y - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = b.x;
      y = b.y;
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = p.x - x;
  dy = p.y - y;
  return dx * dx + dy * dy;
}

/**
 * simplifyPoints - Ramer–Douglas–Peucker path simplification.
 *
 * Iterative (explicit-stack) implementation so it stays O(1) in call-stack
 * depth and never overflows, even for paths with tens of thousands of points.
 * The first and last points are always preserved.
 */
export function simplifyPoints(points: Point2D[], tolerance = 1.5): Point2D[] {
  const len = points.length;
  if (len < 3) return points.slice();

  const sqTolerance = tolerance * tolerance;
  const keep = new Uint8Array(len);
  keep[0] = 1;
  keep[len - 1] = 1;

  // Each entry on the stack is a [first, last] index pair to subdivide.
  const stack: number[] = [0, len - 1];

  while (stack.length > 0) {
    const last = stack.pop() as number;
    const first = stack.pop() as number;

    let maxSqDist = sqTolerance;
    let index = -1;
    for (let i = first + 1; i < last; i++) {
      const sqDist = getSqSegDist(points[i], points[first], points[last]);
      if (sqDist > maxSqDist) {
        index = i;
        maxSqDist = sqDist;
      }
    }

    if (index !== -1) {
      keep[index] = 1;
      stack.push(first, index, index, last);
    }
  }

  const simplified: Point2D[] = [];
  for (let i = 0; i < len; i++) {
    if (keep[i]) simplified.push(points[i]);
  }
  return simplified;
}

/**
 * simplifyPointsByDistance - Reduces points by minimum distance threshold
 */
export function simplifyPointsByDistance(points: Array<{ x: number; y: number }>, minDistance: number = 1.5): Array<{ x: number; y: number }> {
  if (points.length < 2) return points;
  const result = [points[0]];
  let prev = points[0];
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - prev.x;
    const dy = points[i].y - prev.y;
    if (dx * dx + dy * dy >= minDistance * minDistance) {
      result.push(points[i]);
      prev = points[i];
    }
  }
  return result;
}

// =============================================================================
// EXPORTS - Singleton instances
// =============================================================================

export const viewportCache = new ViewportCache();
export const pointerBatcher = new PointerBatcher();