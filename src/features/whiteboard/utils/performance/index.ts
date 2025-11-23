// Performance utilities for whiteboard tools
// Microsoft L67+ Principal Engineer style: modular, typed, robust


/**
 * pointerBatcher - Batches pointer events and schedules updates via requestAnimationFrame.
 * Usage: const batcher = pointerBatcher(callback)
 * batcher.add(point), batcher.scheduleUpdate(fn), batcher.cancel()
 */
export function pointerBatcher<T>(callback: (batch: T[]) => void, batchSize: number = 8) {
  let buffer: T[] = [];
  let rafId: number | null = null;
  let scheduledFn: (() => void) | null = null;

  function add(point: T) {
    buffer.push(point);
    if (buffer.length >= batchSize) {
      callback(buffer);
      buffer = [];
    }
  }

  function scheduleUpdate(fn: () => void) {
    if (rafId !== null) return;
    scheduledFn = fn;
    rafId = window.requestAnimationFrame(() => {
      scheduledFn && scheduledFn();
      rafId = null;
      scheduledFn = null;
    });
  }

  function cancel() {
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
      scheduledFn = null;
    }
    buffer = [];
  }

  return { add, scheduleUpdate, cancel };
}


/**
 * viewportCache - Caches getBoundingClientRect and viewportState per canvas/viewport.
 * Usage: const cache = viewportCache(); cache.get(canvas, viewport)
 */
export function viewportCache() {
  let cache = new WeakMap<HTMLElement, { rect: DOMRect; viewportState: any }>();
  return {
    get(canvas: HTMLElement, viewportState: any) {
      let cached = cache.get(canvas);
      if (!cached || cached.viewportState !== viewportState) {
        const rect = canvas.getBoundingClientRect();
        cached = { rect, viewportState };
        cache.set(canvas, cached);
      }
      return cached;
    },
    clear() {
      cache = new WeakMap();
    },
  };
}

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
