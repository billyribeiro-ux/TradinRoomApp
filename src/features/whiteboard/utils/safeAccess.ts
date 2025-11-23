/**
 * Ultra-safe property access utilities for complete type safety
 */

import type { ViewportState, ViewportTransform, WhiteboardShape, WhiteboardPoint } from '../types';

// ============================================================================
// VIEWPORT SAFE ACCESS
// ============================================================================

export function safeViewportWidth(viewport: ViewportState | ViewportTransform | undefined): number {
  return viewport?.width ?? 1920;
}

export function safeViewportHeight(viewport: ViewportState | ViewportTransform | undefined): number {
  return viewport?.height ?? 1080;
}

export function safeViewportZoom(viewport: ViewportState | ViewportTransform | undefined): number {
  if (!viewport) return 1;
  return viewport.zoom ?? viewport.scale ?? 1;
}

export function safeViewportPanX(viewport: ViewportState | ViewportTransform | undefined): number {
  if (!viewport) return 0;
  return viewport.panX ?? viewport.x ?? 0;
}

export function safeViewportPanY(viewport: ViewportState | ViewportTransform | undefined): number {
  if (!viewport) return 0;
  return viewport.panY ?? viewport.y ?? 0;
}

export function safeViewportDPR(viewport: ViewportState | ViewportTransform | undefined): number {
  return viewport?.dpr ?? window.devicePixelRatio ?? 1;
}

// ============================================================================
// SHAPE SAFE ACCESS
// ============================================================================

export function safeShapePoints(shape: WhiteboardShape | undefined): WhiteboardPoint[] {
  if (!shape) return [];
  if ('points' in shape && Array.isArray(shape.points)) {
    return shape.points as WhiteboardPoint[];
  }
  return [];
}

export function hasShapePoints(shape: WhiteboardShape | undefined): boolean {
  if (!shape) return false;
  return 'points' in shape && Array.isArray(shape.points) && shape.points.length > 0;
}

export function safeShapeWidth(shape: any): number {
  return shape?.width ?? 100;
}

export function safeShapeHeight(shape: any): number {
  return shape?.height ?? 100;
}

export function safeShapeX(shape: WhiteboardShape | undefined): number {
  return shape?.x ?? 0;
}

export function safeShapeY(shape: WhiteboardShape | undefined): number {
  return shape?.y ?? 0;
}

// ============================================================================
// POINT SAFE ACCESS
// ============================================================================

export function safePointX(point: WhiteboardPoint | undefined): number {
  return point?.x ?? 0;
}

export function safePointY(point: WhiteboardPoint | undefined): number {
  return point?.y ?? 0;
}

// ============================================================================
// NULL-SAFE VIEWPORT CREATION
// ============================================================================

export function createSafeViewportState(partial?: Partial<ViewportState>): ViewportState {
  return {
    x: partial?.x ?? 0,
    y: partial?.y ?? 0,
    scale: partial?.scale ?? 1,
    rotation: partial?.rotation,
    dpr: partial?.dpr ?? 1,
    zoom: partial?.zoom ?? partial?.scale ?? 1,
    width: partial?.width ?? 1920,
    height: partial?.height ?? 1080,
    panX: partial?.panX ?? partial?.x ?? 0,
    panY: partial?.panY ?? partial?.y ?? 0,
  };
}

export function createSafeViewportTransform(partial?: Partial<ViewportTransform>): ViewportTransform {
  return {
    panX: partial?.panX ?? 0,
    panY: partial?.panY ?? 0,
    zoom: partial?.zoom ?? 1,
    x: partial?.x ?? partial?.panX ?? 0,
    y: partial?.y ?? partial?.panY ?? 0,
    scale: partial?.scale ?? partial?.zoom ?? 1,
    dpr: partial?.dpr ?? 1,
    width: partial?.width ?? 1920,
    height: partial?.height ?? 1080,
  };
}

// ============================================================================
// TYPE NARROWING GUARDS
// ============================================================================

export function isDefinedViewport(viewport: any): viewport is ViewportState | ViewportTransform {
  return viewport != null && typeof viewport === 'object';
}

export function isDefinedShape(shape: any): shape is WhiteboardShape {
  return shape != null && typeof shape === 'object' && 'type' in shape && 'id' in shape;
}

export function isDefinedPoint(point: any): point is WhiteboardPoint {
  return point != null && typeof point === 'object' && 'x' in point && 'y' in point;
}

// ============================================================================
// BATCH SAFE ACCESS
// ============================================================================

export function safeViewportAccess<T>(
  viewport: ViewportState | ViewportTransform | undefined,
  accessor: (v: ViewportState | ViewportTransform) => T,
  defaultValue: T
): T {
  if (!viewport) return defaultValue;
  try {
    return accessor(viewport) ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

export function safeShapeAccess<T>(
  shape: WhiteboardShape | undefined,
  accessor: (s: WhiteboardShape) => T,
  defaultValue: T
): T {
  if (!shape) return defaultValue;
  try {
    return accessor(shape) ?? defaultValue;
  } catch {
    return defaultValue;
  }
}
