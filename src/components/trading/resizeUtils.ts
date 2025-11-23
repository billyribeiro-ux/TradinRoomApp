/**
 * Resize Utilities - Trading Room
 * ============================================================================
 * Helper functions for resize calculations
 */

/**
 * Clamps a number between a minimum and maximum value.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

/**
 * Calculate clamped left panel width based on viewport
 */
export function getClampedLeftPanelWidth(
  desiredWidth: number,
  viewportWidth: number
): number {
  const minWidth = Math.max(280, viewportWidth * 0.2);
  const maxWidth = Math.min(viewportWidth * 0.7, viewportWidth - 360);
  return clamp(desiredWidth, minWidth, maxWidth);
}

/**
 * Calculate clamped alerts height based on viewport
 */
export function getClampedAlertsHeight(
  desiredHeight: number,
  viewportHeight: number
): number {
  const minHeight = Math.max(120, viewportHeight * 0.15);
  const maxHeight = viewportHeight * 0.6;
  return clamp(desiredHeight, minHeight, maxHeight);
}
