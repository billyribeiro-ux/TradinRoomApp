/**
 * Type guards for whiteboard shapes
 */

import type { WhiteboardShape, WhiteboardPoint } from '../types';

/**
 * Check if shape has points property
 */
export function hasPoints(shape: WhiteboardShape): shape is WhiteboardShape & { points: WhiteboardPoint[] } {
  return 'points' in shape && Array.isArray((shape as any).points);
}

/**
 * Safely get points from a shape
 */
export function getPoints(shape: WhiteboardShape): WhiteboardPoint[] {
  if (hasPoints(shape)) {
    return shape.points;
  }
  return [];
}

/**
 * Check if shape has a specific property
 */
export function hasProperty<K extends string>(
  shape: WhiteboardShape,
  prop: K
): shape is WhiteboardShape & Record<K, any> {
  return prop in shape;
}
