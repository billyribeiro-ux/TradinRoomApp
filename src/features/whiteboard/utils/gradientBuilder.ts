// ============================================================================
// GRADIENT BUILDER - Linear Gradient Utilities
// ============================================================================
// Build canvas gradients for highlighter tool
// ============================================================================

import type { LinearGradient } from '../types';

/**
 * Build a CanvasGradient from LinearGradient definition
 */
export function buildLinearGradient(
  ctx: CanvasRenderingContext2D,
  bbox: { x: number; y: number; width: number; height: number },
  gradient: LinearGradient
): CanvasGradient {
  const { angleDeg, stops } = gradient;
  
  // Convert angle to radians
  const angleRad = (angleDeg * Math.PI) / 180;
  
  // Calculate gradient line endpoints
  const centerX = bbox.x + bbox.width / 2;
  const centerY = bbox.y + bbox.height / 2;
  
  // Calculate line length based on bbox diagonal
  const diagonal = Math.sqrt(bbox.width ** 2 + bbox.height ** 2);
  const halfLength = diagonal / 2;
  
  const x1 = centerX - halfLength * Math.cos(angleRad);
  const y1 = centerY - halfLength * Math.sin(angleRad);
  const x2 = centerX + halfLength * Math.cos(angleRad);
  const y2 = centerY + halfLength * Math.sin(angleRad);
  
  const canvasGradient = ctx.createLinearGradient(x1, y1, x2, y2);
  
  // Add color stops
  stops.forEach(stop => {
    const alpha = stop.alpha ?? 1;
    const color = stop.color;
    
    // Parse color and apply alpha
    const colorWithAlpha = applyAlphaToColor(color, alpha);
    canvasGradient.addColorStop(stop.offset, colorWithAlpha);
  });
  
  return canvasGradient;
}

/**
 * Apply alpha to a color string
 */
function applyAlphaToColor(color: string, alpha: number): string {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  
  // Handle rgb/rgba
  if (color.startsWith('rgb')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (match) {
      return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
    }
  }
  
  // Fallback: return as-is
  return color;
}

/**
 * Create a default soft highlighter gradient
 */
export function createDefaultHighlighterGradient(color: string): LinearGradient {
  return {
    type: 'linear',
    angleDeg: 90,
    stops: [
      { offset: 0, color, alpha: 0.3 },
      { offset: 0.5, color, alpha: 0.5 },
      { offset: 1, color, alpha: 0.3 },
    ],
  };
}

/**
 * Get bounding box for a set of points
 */
export function getPointsBoundingBox(
  points: Array<{ x: number; y: number }>,
  padding = 0
): { x: number; y: number; width: number; height: number } {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  let minX = points[0].x;
  let minY = points[0].y;
  let maxX = points[0].x;
  let maxY = points[0].y;
  
  for (let i = 1; i < points.length; i++) {
    minX = Math.min(minX, points[i].x);
    minY = Math.min(minY, points[i].y);
    maxX = Math.max(maxX, points[i].x);
    maxY = Math.max(maxY, points[i].y);
  }
  
  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + 2 * padding,
    height: maxY - minY + 2 * padding,
  };
}
