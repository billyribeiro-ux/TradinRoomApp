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

/**
 * simplifyPoints - Ramer-Douglas-Peucker algorithm for path simplification
 */
export function simplifyPoints(points: Array<{ x: number; y: number }>, tolerance: number = 1.5): Array<{ x: number; y: number }> {
  if (points.length < 3) return points;
  const sqTolerance = tolerance * tolerance;

  function getSqDist(p1: { x: number; y: number }, p2: { x: number; y: number }) {
    const dx = p1.x - p2.x, dy = p1.y - p2.y;
    return dx * dx + dy * dy;
  }

  function simplifyDPStep(pts: Array<{ x: number; y: number }>, first: number, last: number, simplified: Array<{ x: number; y: number }>) {
    let maxDist = sqTolerance, index = -1;
    for (let i = first + 1; i < last; i++) {
      const dist = getSqDist(pts[i], pts[first]) + getSqDist(pts[i], pts[last]);
      if (dist > maxDist) {
        index = i;
        maxDist = dist;
      }
    }
    if (index !== -1) {
      simplifyDPStep(pts, first, index, simplified);
      simplifyDPStep(pts, index, last, simplified);
    } else {
      simplified.push(pts[first]);
    }
  }

  const simplified: Array<{ x: number; y: number }> = [];
  simplifyDPStep(points, 0, points.length - 1, simplified);
  simplified.push(points[points.length - 1]);
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