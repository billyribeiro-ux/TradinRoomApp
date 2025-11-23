/**
 * Type helper utilities for safe property access
 */

import type { ViewportState, ViewportTransform, WhiteboardShape } from '../types';

/**
 * Safely get viewport pan X coordinate
 */
export function getViewportPanX(viewport: ViewportState | ViewportTransform): number {
  if ('panX' in viewport && viewport.panX !== undefined) {
    return viewport.panX;
  }
  if ('x' in viewport && viewport.x !== undefined) {
    return viewport.x;
  }
  return 0;
}

/**
 * Safely get viewport pan Y coordinate
 */
export function getViewportPanY(viewport: ViewportState | ViewportTransform): number {
  if ('panY' in viewport && viewport.panY !== undefined) {
    return viewport.panY;
  }
  if ('y' in viewport && viewport.y !== undefined) {
    return viewport.y;
  }
  return 0;
}

/**
 * Safely get viewport zoom/scale
 */
export function getViewportZoom(viewport: ViewportState | ViewportTransform): number {
  if ('zoom' in viewport && viewport.zoom !== undefined) {
    return viewport.zoom;
  }
  if ('scale' in viewport && viewport.scale !== undefined) {
    return viewport.scale;
  }
  return 1;
}

/**
 * Normalize viewport to consistent format
 */
export function normalizeViewport(viewport: ViewportState | ViewportTransform): {
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;
  dpr: number;
} {
  return {
    x: getViewportPanX(viewport),
    y: getViewportPanY(viewport),
    scale: getViewportZoom(viewport),
    width: viewport.width ?? 1920,
    height: viewport.height ?? 1080,
    dpr: viewport.dpr ?? 1,
  };
}

/**
 * Convert ViewportState to ViewportTransform
 */
export function toViewportTransform(viewport: ViewportState): ViewportTransform {
  return {
    panX: viewport.panX ?? viewport.x,
    panY: viewport.panY ?? viewport.y,
    zoom: viewport.zoom ?? viewport.scale,
    x: viewport.x,
    y: viewport.y,
    scale: viewport.scale,
    dpr: viewport.dpr,
    width: viewport.width,
    height: viewport.height,
  };
}

/**
 * Convert ViewportTransform to ViewportState
 */
export function toViewportState(viewport: ViewportTransform): ViewportState {
  return {
    x: viewport.x ?? viewport.panX,
    y: viewport.y ?? viewport.panY,
    scale: viewport.scale ?? viewport.zoom,
    panX: viewport.panX,
    panY: viewport.panY,
    zoom: viewport.zoom,
    dpr: viewport.dpr,
    width: viewport.width,
    height: viewport.height,
  };
}

/**
 * Safely get shape points
 */
export function getShapePoints(shape: WhiteboardShape): Array<{ x: number; y: number }> | undefined {
  if ('points' in shape && Array.isArray(shape.points)) {
    return shape.points;
  }
  return undefined;
}

/**
 * Check if shape has width property
 */
export function hasWidth(shape: any): shape is { width: number } {
  return typeof shape?.width === 'number';
}

/**
 * Check if shape has height property
 */
export function hasHeight(shape: any): shape is { height: number } {
  return typeof shape?.height === 'number';
}

/**
 * Get safe dimensions
 */
export function getShapeDimensions(shape: any): { width: number; height: number } {
  return {
    width: hasWidth(shape) ? shape.width : 100,
    height: hasHeight(shape) ? shape.height : 100,
  };
}
