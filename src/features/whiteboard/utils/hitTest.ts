// ============================================================================
// HIT TEST UTILITIES - Pixel-Accurate Hit Testing
// ============================================================================
// Hit testing for transformed emoji objects with rotation support
// ============================================================================

import type { EmojiObject, TextAnnotation, WhiteboardPoint, ViewportState } from '../types';

export interface HitTestResult {
  type: 'none' | 'body' | 'resize-handle' | 'rotate-handle';
  handle?: 'nw' | 'ne' | 'sw' | 'se';
}

const HANDLE_SIZE = 12; // pixels
const ROTATE_HANDLE_DISTANCE = 30; // pixels from top

// Hit test emoji object
export function hitTestEmoji(
  emoji: EmojiObject,
  worldPos: WhiteboardPoint,
  viewport: ViewportState
): HitTestResult {
  // Transform world position to emoji local space
  const dx = worldPos.x - emoji.x;
  const dy = worldPos.y - emoji.y;
  
  // Apply inverse rotation
  const cos = Math.cos(-emoji.rotation);
  const sin = Math.sin(-emoji.rotation);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;
  
  // Emoji size in world space (base size 48px scaled)
  const baseSize = 48 / viewport.zoom;
  const size = baseSize * emoji.scale;
  const halfSize = size / 2;
  
  // Check rotate handle (above emoji)
  const rotateHandleY = -halfSize - (ROTATE_HANDLE_DISTANCE / viewport.zoom);
  const rotateHandleSize = HANDLE_SIZE / viewport.zoom;
  
  if (
    Math.abs(localX) < rotateHandleSize &&
    Math.abs(localY - rotateHandleY) < rotateHandleSize
  ) {
    return { type: 'rotate-handle' };
  }
  
  // Check resize handles (corners)
  const handleSize = HANDLE_SIZE / viewport.zoom;
  
  // NW handle
  if (
    Math.abs(localX + halfSize) < handleSize &&
    Math.abs(localY + halfSize) < handleSize
  ) {
    return { type: 'resize-handle', handle: 'nw' };
  }
  
  // NE handle
  if (
    Math.abs(localX - halfSize) < handleSize &&
    Math.abs(localY + halfSize) < handleSize
  ) {
    return { type: 'resize-handle', handle: 'ne' };
  }
  
  // SW handle
  if (
    Math.abs(localX + halfSize) < handleSize &&
    Math.abs(localY - halfSize) < handleSize
  ) {
    return { type: 'resize-handle', handle: 'sw' };
  }
  
  // SE handle
  if (
    Math.abs(localX - halfSize) < handleSize &&
    Math.abs(localY - halfSize) < handleSize
  ) {
    return { type: 'resize-handle', handle: 'se' };
  }
  
  // Check body (with some padding for easier selection)
  const padding = 5 / viewport.zoom;
  if (
    Math.abs(localX) < halfSize + padding &&
    Math.abs(localY) < halfSize + padding
  ) {
    return { type: 'body' };
  }
  
  return { type: 'none' };
}

// Check if point is inside rotated rectangle
export function pointInRotatedRect(
  point: WhiteboardPoint,
  rect: { x: number; y: number; width: number; height: number; rotation: number }
): boolean {
  // Transform point to rectangle local space
  const dx = point.x - rect.x;
  const dy = point.y - rect.y;
  
  const cos = Math.cos(-rect.rotation);
  const sin = Math.sin(-rect.rotation);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;
  
  const halfWidth = rect.width / 2;
  const halfHeight = rect.height / 2;
  
  return (
    Math.abs(localX) <= halfWidth &&
    Math.abs(localY) <= halfHeight
  );
}

// Get bounding box for rotated emoji
export function getEmojiBounds(emoji: EmojiObject, viewport: ViewportState) {
  const baseSize = 48 / viewport.zoom;
  const size = baseSize * emoji.scale;
  const halfSize = size / 2;
  
  // Calculate rotated corners
  const corners = [
    { x: -halfSize, y: -halfSize },
    { x: halfSize, y: -halfSize },
    { x: halfSize, y: halfSize },
    { x: -halfSize, y: halfSize },
  ];
  
  const cos = Math.cos(emoji.rotation);
  const sin = Math.sin(emoji.rotation);
  
  const rotatedCorners = corners.map(corner => ({
    x: emoji.x + corner.x * cos - corner.y * sin,
    y: emoji.y + corner.x * sin + corner.y * cos,
  }));
  
  const xs = rotatedCorners.map(c => c.x);
  const ys = rotatedCorners.map(c => c.y);
  
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

// Hit test text annotation
export function hitTestText(
  point: WhiteboardPoint,
  text: TextAnnotation,
  zoom: number
): boolean {
  const dx = point.x - text.x;
  const dy = point.y - text.y;
  
  // Apply inverse rotation
  const cos = Math.cos(-text.rotation);
  const sin = Math.sin(-text.rotation);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;
  
  const width = (text.width / zoom) * text.scale;
  const height = (text.height / zoom) * text.scale;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  
  // Check body with padding
  const padding = 5 / zoom;
  return (
    Math.abs(localX) < halfWidth + padding &&
    Math.abs(localY) < halfHeight + padding
  );
}

// Hit test stroke (freehand or highlighter)
export function hitTestStroke(
  point: WhiteboardPoint,
  points: WhiteboardPoint[],
  threshold: number = 10
): boolean {
  if (points.length < 2) return false;
  
  // Check distance to each segment
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    
    const dist = distanceToSegment(point, p1, p2);
    if (dist < threshold) {
      return true;
    }
  }
  
  return false;
}

// Helper: distance from point to line segment
function distanceToSegment(
  point: WhiteboardPoint,
  p1: WhiteboardPoint,
  p2: WhiteboardPoint
): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const lengthSquared = dx * dx + dy * dy;
  
  if (lengthSquared === 0) {
    // p1 and p2 are the same point
    const pdx = point.x - p1.x;
    const pdy = point.y - p1.y;
    return Math.sqrt(pdx * pdx + pdy * pdy);
  }
  
  // Project point onto line segment
  let t = ((point.x - p1.x) * dx + (point.y - p1.y) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));
  
  const projX = p1.x + t * dx;
  const projY = p1.y + t * dy;
  
  const pdx = point.x - projX;
  const pdy = point.y - projY;
  
  return Math.sqrt(pdx * pdx + pdy * pdy);
}
