// ============================================================================
// DRAWING PRIMITIVES - Canvas2D Rendering Functions (WORLD-SPACE)
// ============================================================================
// Low-level drawing utilities for all shape types
// IMPORTANT: All functions draw in WORLD space (0-1 normalized coordinates)
// WhiteboardCanvas applies DPR + viewport transform before calling these
// ============================================================================

import type { 
  ViewportTransform,
  WhiteboardPoint,
  WhiteboardAnnotation,
  TextAnnotation,
  WhiteboardShape,
  ShapeObject,
  EmojiObject,
  ViewportState,
  LinearGradient,
  CompositeMode
} from '../types';
import { safeShapePoints, hasShapePoints } from './safeAccess';
import { worldToScreen } from './transform';
import { drawFormattedText } from './textLayout';
import { buildLinearGradient, getPointsBoundingBox } from './gradientBuilder';
import { debug } from './debug';

/**
 * Draw a stroke (pen/highlighter) in WORLD space
 * NOTE: ctx already has transform matrix applied by WhiteboardCanvas
 */
export function drawStroke(
  ctx: CanvasRenderingContext2D,
  points: WhiteboardPoint[],
  color: string,
  size: number,
  opacity: number,
  _viewport: ViewportState, // unused - for API compatibility
  gradient?: LinearGradient,
  composite?: CompositeMode
): void {
  if (points.length < 2) return;

  ctx.save();

  // Apply composite mode for highlighter
  if (composite) {
    ctx.globalCompositeOperation = composite as GlobalCompositeOperation;
  }

  // Set up stroke style (WORLD coordinates)
  if (gradient && points.length > 0) {
    // Use gradient for highlighter (world-space bounding box)
    const bbox = getPointsBoundingBox(points, size);
    const canvasGradient = buildLinearGradient(ctx, bbox, gradient);
    ctx.strokeStyle = canvasGradient;
  } else {
    ctx.strokeStyle = color;
    ctx.globalAlpha = opacity;
  }

  ctx.lineWidth = size; // WORLD units (will be scaled by transform)
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.stroke();
  ctx.restore();
}

/**
 * Draw a rectangle in WORLD space
 * NOTE: ctx already has transform matrix applied by WhiteboardCanvas
 */
export function drawRectangle(
  ctx: CanvasRenderingContext2D,
  start: WhiteboardPoint,
  end: WhiteboardPoint,
  color: string,
  size: number,
  fillColor: string | undefined,
  opacity: number,
  _viewport: ViewportState // unused - for API compatibility
): void {
  ctx.save();

  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  ctx.globalAlpha = opacity;

  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, width, height);
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = size; // WORLD units
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.strokeRect(x, y, width, height);

  ctx.restore();
}

/**
 * Draw a circle/ellipse in WORLD space
 * NOTE: ctx already has transform matrix applied by WhiteboardCanvas
 */
export function drawCircle(
  ctx: CanvasRenderingContext2D,
  center: WhiteboardPoint,
  edgePoint: WhiteboardPoint,
  color: string,
  size: number,
  fillColor: string | undefined,
  opacity: number,
  _viewport: ViewportState // unused - for API compatibility
): void {
  ctx.save();

  // Calculate radii in WORLD units
  let radiusX = Math.abs(edgePoint.x - center.x);
  let radiusY = Math.abs(edgePoint.y - center.y);

  // Guard against zero radii
  const EPS = 1e-3;
  radiusX = Math.max(radiusX, EPS);
  radiusY = Math.max(radiusY, EPS);

  ctx.globalAlpha = opacity;
  ctx.beginPath();
  ctx.ellipse(center.x, center.y, radiusX, radiusY, 0, 0, 2 * Math.PI);

  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = size; // WORLD units
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw a line in WORLD space
 * NOTE: ctx already has transform matrix applied by WhiteboardCanvas
 */
export function drawLine(
  ctx: CanvasRenderingContext2D,
  start: WhiteboardPoint,
  end: WhiteboardPoint,
  color: string,
  size: number,
  opacity: number,
  _viewport: ViewportState // unused - for API compatibility
): void {
  ctx.save();

  ctx.strokeStyle = color;
  ctx.lineWidth = size; // WORLD units
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = opacity;

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw an arrow in WORLD space
 * NOTE: ctx already has transform matrix applied by WhiteboardCanvas
 */
export function drawArrow(
  ctx: CanvasRenderingContext2D,
  start: WhiteboardPoint,
  end: WhiteboardPoint,
  color: string,
  size: number,
  opacity: number,
  _viewport: ViewportState // unused - for API compatibility
): void {
  ctx.save();

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = size; // WORLD units
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.globalAlpha = opacity;

  // Draw line shaft
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  // Draw arrowhead (world-space, scales with zoom)
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const headLength = size * 3; // proportional to stroke width
  const sideAngle = Math.PI / 6; // 30°

  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLength * Math.cos(angle - sideAngle),
    end.y - headLength * Math.sin(angle - sideAngle)
  );
  ctx.lineTo(
    end.x - headLength * Math.cos(angle + sideAngle),
    end.y - headLength * Math.sin(angle + sideAngle)
  );
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Draw text with proper formatting
 * NOTE: Text needs screen-space coordinates for font rendering
 * This function temporarily resets transform to draw at screen coordinates
 */
export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  position: WhiteboardPoint,
  fontSize: number,
  fontFamily: string,
  fontWeight: number | 'normal' | 'bold',
  fontStyle: 'normal' | 'italic',
  textDecoration: 'none' | 'underline' | 'line-through',
  color: string,
  opacity: number,
  viewport: ViewportState,
  maxWidth?: number
): void {
  if (!text) return;

  debug.render('Drawing text', { text, fontSize, fontFamily, position });

  // Convert world position to screen coordinates
  const p = worldToScreen(position, viewport);

  // Save current transform, reset to identity for text rendering
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // Convert fontWeight to number for drawFormattedText
  const numericFontWeight = typeof fontWeight === 'string' 
    ? (fontWeight === 'bold' ? 700 : 400)
    : fontWeight;
    
  drawFormattedText(
    ctx,
    text,
    p.x,
    p.y,
    {
      fontFamily,
      fontSize,
      fontWeight: numericFontWeight,
      fontStyle,
      textDecoration,
    },
    color,
    opacity,
    maxWidth
  );

  ctx.restore(); // Restores world-space transform
}

/**
 * Draw a stamp (emoji)
 * NOTE: Emoji needs screen-space coordinates for font rendering
 * This function temporarily resets transform to draw at screen coordinates
 */
export function drawStamp(
  ctx: CanvasRenderingContext2D,
  emoji: string,
  position: WhiteboardPoint,
  size: number,
  opacity: number,
  viewport: ViewportState
): void {
  if (!emoji) return;

  // Convert world position to screen coordinates
  const p = worldToScreen(position, viewport);

  // Save current transform, reset to identity for emoji rendering
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  ctx.font = `${size}px sans-serif`;
  ctx.globalAlpha = opacity;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  ctx.fillText(emoji, p.x, p.y);

  ctx.restore(); // Restores world-space transform
}

/**
 * Draw a shape based on its type
 */
export function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: WhiteboardShape,
  viewport: ViewportState
): void {
  switch (shape.type) {
    case 'pen':
      drawStroke(ctx, shape.points, shape.color, shape.size, shape.opacity, viewport);
      break;

    case 'highlighter':
      drawStroke(ctx, shape.points, shape.color, shape.size, shape.opacity, viewport);
      break;

    case 'circle':
      if (shape.points.length >= 2) {
        drawCircle(
          ctx,
          shape.points[0],
          shape.points[shape.points.length - 1],
          shape.color,
          shape.size,
          shape.fillColor,
          shape.opacity,
          viewport
        );
      }
      break;

    case 'line':
      if (shape.points.length >= 2) {
        drawLine(
          ctx,
          shape.points[0],
          shape.points[shape.points.length - 1],
          shape.color,
          shape.size,
          shape.opacity,
          viewport
        );
      }
      break;

    case 'arrow':
      if (shape.points.length >= 2) {
        drawArrow(
          ctx,
          shape.points[0],
          shape.points[shape.points.length - 1],
          shape.color,
          shape.size,
          shape.opacity,
          viewport
        );
      }
      break;

    case 'text':
      if (shape.text && shape.points.length > 0) {
        drawText(
          ctx,
          shape.text,
          shape.points[0],
          shape.fontSize || 16,
          shape.fontFamily || 'Inter, system-ui, sans-serif',
          shape.fontWeight || 400,
          shape.fontStyle || 'normal',
          shape.textDecoration || 'none',
          shape.color,
          shape.opacity,
          viewport,
          shape.width
        );
      }
      break;

    case 'stamp':
      if (shape.stampEmoji && shape.points.length > 0) {
        drawStamp(
          ctx,
          shape.stampEmoji,
          shape.points[0],
          shape.size,
          shape.opacity,
          viewport
        );
      }
      break;

    case 'rectangle':
      if (shape.points.length >= 2) {
        drawRectangle(
          ctx,
          shape.points[0],
          shape.points[shape.points.length - 1],
          shape.color,
          shape.size,
          shape.fillColor,
          shape.opacity,
          viewport
        );
      }
      break;
  }
}

/**
 * Clear the entire canvas
 */
export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.restore();
}