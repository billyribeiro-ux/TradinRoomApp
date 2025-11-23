/**
 * ============================================================================
 * TRANSFORM UTILITIES - Microsoft L70+ Distinguished Principal Engineer
 * ============================================================================
 * Mathematically correct coordinate transforms with proper DPR handling
 * 
 * COORDINATE SPACES:
 * 1. Screen Space: CSS pixels relative to canvas element (0,0 at top-left)
 * 2. World Space: Normalized coordinates (0-1 range)
 * 3. Device Space: Physical pixels on screen (CSS * DPR)
 * 
 * TRANSFORM PIPELINE:
 * Screen (CSS) → World (normalized) → Device (physical pixels)
 * ============================================================================
 */

import type { WhiteboardPoint, ViewportState, ViewportTransform } from '../types';
import { getSystemDPR } from './dpr';

// Export type for compatibility
export type { ViewportTransform };

/**
 * Convert screen coordinates (CSS pixels) to world coordinates (0-1 normalized)
 * 
 * @param screenX - X position in CSS pixels relative to canvas
 * @param screenY - Y position in CSS pixels relative to canvas
 * @param viewport - Viewport state with CSS dimensions
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  viewport: ViewportState
): WhiteboardPoint {
  const { panX, panY, zoom, width, height } = viewport;
  
  // Normalize screen coordinates to 0-1 range
  const normalizedX = screenX / width;
  const normalizedY = screenY / height;
  
  // Apply inverse viewport transform
  const worldX = (normalizedX - panX) / zoom;
  const worldY = (normalizedY - panY) / zoom;
  
  return { x: worldX, y: worldY };
}

/**
 * Convert world coordinates (0-1 normalized) to screen coordinates (CSS pixels)
 * 
 * @param point - Point in world space
 * @param viewport - Viewport state with CSS dimensions
 */
export function worldToScreen(
  point: WhiteboardPoint,
  viewport: ViewportState
): { x: number; y: number } {
  const { panX, panY, zoom, width, height } = viewport;
  
  // Apply viewport transform
  const normalizedX = point.x * zoom + panX;
  const normalizedY = point.y * zoom + panY;
  
  // Convert to CSS pixels
  const screenX = normalizedX * width;
  const screenY = normalizedY * height;
  
  return { x: screenX, y: screenY };
}

/**
 * Apply complete transform to canvas context
 * This sets up the transform matrix for world → device coordinate mapping
 * 
 * CRITICAL: This is the ONLY place where DPR should be in the transform!
 * 
 * @param ctx - Canvas 2D context
 * @param viewport - Viewport state with CSS dimensions
 */
export function applyViewportTransform(
  ctx: CanvasRenderingContext2D,
  viewport: ViewportState
): void {
  const { panX, panY, zoom, width, height } = viewport;
  const dpr = getSystemDPR();
  
  // Build transform matrix: Device = DPR * CSS * Viewport * World
  // [a c e]   [scaleX  0      translateX]
  // [b d f] = [0       scaleY  translateY]
  // [0 0 1]   [0       0       1         ]
  
  const scaleX = zoom * width * dpr;
  const scaleY = zoom * height * dpr;
  const translateX = panX * width * dpr;
  const translateY = panY * height * dpr;
  
  ctx.setTransform(
    scaleX,     // a: horizontal scaling
    0,          // b: horizontal skewing
    0,          // c: vertical skewing
    scaleY,     // d: vertical scaling
    translateX, // e: horizontal translation
    translateY  // f: vertical translation
  );
}

/**
 * Reset canvas transform to identity
 */
export function resetTransform(ctx: CanvasRenderingContext2D): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/**
 * Alias for applyViewportTransform for backward compatibility
 */
export const applyTransform = applyViewportTransform;

/**
 * Apply transform for screen-space rendering (text, UI elements)
 * This is used when we need to render in CSS pixels, not world space
 */
export function applyScreenTransform(ctx: CanvasRenderingContext2D): void {
  const dpr = getSystemDPR();
  
  // Simple DPR scaling for screen-space rendering
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/**
 * Get the inverse transform matrix for hit testing
 * Converts device pixels back to world coordinates
 */
export function getInverseTransform(viewport: ViewportState): {
  a: number; b: number; c: number;
  d: number; e: number; f: number;
} {
  const { panX, panY, zoom, width, height } = viewport;
  const dpr = getSystemDPR();
  
  // Forward transform components
  const scaleX = zoom * width * dpr;
  const scaleY = zoom * height * dpr;
  const translateX = panX * width * dpr;
  const translateY = panY * height * dpr;
  
  // Inverse transform (simplified for no skew)
  const invScaleX = 1 / scaleX;
  const invScaleY = 1 / scaleY;
  const invTranslateX = -translateX * invScaleX;
  const invTranslateY = -translateY * invScaleY;
  
  return {
    a: invScaleX,
    b: 0,
    c: 0,
    d: invScaleY,
    e: invTranslateX,
    f: invTranslateY
  };
}

/**
 * Transform a point using a matrix
 */
export function transformPoint(
  point: { x: number; y: number },
  matrix: { a: number; b: number; c: number; d: number; e: number; f: number }
): { x: number; y: number } {
  return {
    x: matrix.a * point.x + matrix.c * point.y + matrix.e,
    y: matrix.b * point.x + matrix.d * point.y + matrix.f
  };
}

/**
 * Get bounding box of points in world space
 */
export function getWorldBounds(points: WhiteboardPoint[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }
  
  let minX = points[0].x;
  let minY = points[0].y;
  let maxX = points[0].x;
  let maxY = points[0].y;
  
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  };
}

/**
 * Clamp zoom level to reasonable bounds
 */
export function clampZoom(zoom: number): number {
  const MIN_ZOOM = 0.1;  // 10% minimum zoom
  const MAX_ZOOM = 10;   // 1000% maximum zoom
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
}

/**
 * Calculate zoom to fit content in viewport
 */
export function calculateFitZoom(
  worldBounds: { width: number; height: number },
  _viewportWidth: number,
  _viewportHeight: number,
  padding: number = 0.1
): number {
  if (worldBounds.width === 0 || worldBounds.height === 0) {
    return 1;
  }
  
  // Add padding
  const paddedWidth = worldBounds.width * (1 + padding * 2);
  const paddedHeight = worldBounds.height * (1 + padding * 2);
  
  // Calculate zoom to fit
  const zoomX = 1 / paddedWidth;
  const zoomY = 1 / paddedHeight;
  
  // Use the smaller zoom to ensure everything fits
  return clampZoom(Math.min(zoomX, zoomY));
}
