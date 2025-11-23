// ============================================================================
// TEXT LAYOUT UTILITIES - Text Measurement & Line Breaking
// ============================================================================
// DPR-aware text rendering with proper metrics
// ============================================================================

export interface TextMetrics {
  lines: string[];
  lineHeights: number[];
  totalWidth: number;
  totalHeight: number;
  baseline: number;
}

export interface FontStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline' | 'line-through';
}

export interface CaretPosition {
  x: number;
  y: number;
  height: number;
  line: number;
  column: number;
}

/**
 * Get DPR-adjusted font string for canvas
 */
export function getFontString(style: FontStyle, dpr: number = 1): string {
  const weight = style.fontWeight === 700 ? 'bold' : 'normal';
  const fontStyle = style.fontStyle === 'italic' ? 'italic' : 'normal';
  const size = Math.round(style.fontSize * dpr);
  
  return `${fontStyle} ${weight} ${size}px ${style.fontFamily}`;
}

/**
 * Measure text with proper baseline and line height
 */
export function measureText(
  ctx: CanvasRenderingContext2D,
  text: string,
  style: FontStyle,
  maxWidth?: number
): TextMetrics {
  ctx.save();
  ctx.font = getFontString(style, 1);
  
  const lines: string[] = [];
  const lineHeights: number[] = [];
  const lineHeight = style.fontSize * 1.2; // Standard line height
  
  if (!maxWidth || !text.includes('\n')) {
    // Handle single line or no wrapping
    const textLines = text.split('\n');
    let maxLineWidth = 0;
    
    textLines.forEach(line => {
      lines.push(line);
      lineHeights.push(lineHeight);
      const metrics = ctx.measureText(line);
      maxLineWidth = Math.max(maxLineWidth, metrics.width);
    });
    
    ctx.restore();
    return {
      lines,
      lineHeights,
      totalWidth: maxLineWidth,
      totalHeight: lines.length * lineHeight,
      baseline: lineHeight * 0.8,
    };
  }
  
  // Multi-line with word wrap
  const paragraphs = text.split('\n');
  let maxLineWidth = 0;
  
  paragraphs.forEach(paragraph => {
    if (!paragraph) {
      lines.push('');
      lineHeights.push(lineHeight);
      return;
    }
    
    const words = paragraph.split(' ');
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        lineHeights.push(lineHeight);
        maxLineWidth = Math.max(maxLineWidth, ctx.measureText(currentLine).width);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
      lineHeights.push(lineHeight);
      maxLineWidth = Math.max(maxLineWidth, ctx.measureText(currentLine).width);
    }
  });
  
  ctx.restore();
  
  return {
    lines,
    lineHeights,
    totalWidth: maxLineWidth,
    totalHeight: lines.length * lineHeight,
    baseline: lineHeight * 0.8,
  };
}

/**
 * Draw text with proper formatting and DPR scaling
 */
export function drawFormattedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  style: FontStyle,
  color: string,
  opacity: number,
  maxWidth?: number
): void {
  if (!text) return;
  
  ctx.save();
  
  const dpr = window.devicePixelRatio || 1;
  ctx.font = getFontString(style, dpr);
  ctx.fillStyle = color;
  ctx.globalAlpha = opacity;
  ctx.textBaseline = 'alphabetic';
  
  const metrics = measureText(ctx, text, style, maxWidth);
  
  // Draw each line
  let currentY = y + metrics.baseline;
  for (let i = 0; i < metrics.lines.length; i++) {
    const line = metrics.lines[i];
    ctx.fillText(line, x, currentY);
    
    // Draw underline if needed
    if (style.textDecoration === 'underline') {
      const lineMetrics = ctx.measureText(line);
      const underlineY = currentY + style.fontSize * 0.1;
      ctx.beginPath();
      ctx.moveTo(x, underlineY);
      ctx.lineTo(x + lineMetrics.width, underlineY);
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, style.fontSize * 0.05);
      ctx.stroke();
    }
    
    currentY += metrics.lineHeights[i];
  }
  
  ctx.restore();
}

/**
 * Get caret position from text index
 */
export function getCaretPosition(
  ctx: CanvasRenderingContext2D,
  text: string,
  index: number,
  textX: number,
  textY: number,
  style: FontStyle
): CaretPosition {
  ctx.save();
  ctx.font = getFontString(style, 1);
  
  const lines = text.split('\n');
  const lineHeight = style.fontSize * 1.2;
  
  let currentIndex = 0;
  let line = 0;
  let column = 0;
  
  // Find which line the index is on
  for (let i = 0; i < lines.length; i++) {
    const lineLength = lines[i].length;
    if (currentIndex + lineLength >= index) {
      line = i;
      column = index - currentIndex;
      break;
    }
    currentIndex += lineLength + 1; // +1 for newline
  }
  
  // Measure text up to column
  const lineText = lines[line] || '';
  const textBeforeCaret = lineText.substring(0, column);
  const width = ctx.measureText(textBeforeCaret).width;
  
  ctx.restore();
  
  return {
    x: textX + width,
    y: textY + line * lineHeight,
    height: lineHeight,
    line,
    column,
  };
}

/**
 * Get cursor position from click coordinates
 */
export function getCursorPositionFromPoint(
  ctx: CanvasRenderingContext2D,
  text: string,
  clickX: number,
  clickY: number,
  textX: number,
  textY: number,
  style: FontStyle
): { index: number; line: number } {
  ctx.save();
  ctx.font = getFontString(style, 1);
  
  const lines = text.split('\n');
  const lineHeight = style.fontSize * 1.2;
  
  // Find line
  const relativeY = clickY - textY;
  const line = Math.max(0, Math.min(lines.length - 1, Math.floor(relativeY / lineHeight)));
  
  // Find character in line
  const lineText = lines[line] || '';
  const relativeX = clickX - textX;
  
  let closestIndex = 0;
  let closestDistance = Infinity;
  
  for (let i = 0; i <= lineText.length; i++) {
    const substr = lineText.substring(0, i);
    const width = ctx.measureText(substr).width;
    const distance = Math.abs(width - relativeX);
    
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = i;
    }
  }
  
  // Calculate absolute index
  let absoluteIndex = 0;
  for (let i = 0; i < line; i++) {
    absoluteIndex += lines[i].length + 1; // +1 for newline
  }
  absoluteIndex += closestIndex;
  
  ctx.restore();
  
  return { index: absoluteIndex, line };
}

/**
 * Get selection rectangles for a text range
 */
export function getSelectionRects(
  ctx: CanvasRenderingContext2D,
  text: string,
  startIndex: number,
  endIndex: number,
  textX: number,
  textY: number,
  style: FontStyle
): Array<{ x: number; y: number; width: number; height: number }> {
  if (startIndex === endIndex) return [];
  
  const [start, end] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
  
  ctx.save();
  ctx.font = getFontString(style, 1);
  
  const lines = text.split('\n');
  const lineHeight = style.fontSize * 1.2;
  const rects: Array<{ x: number; y: number; width: number; height: number }> = [];
  
  let currentIndex = 0;
  
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const lineStart = currentIndex;
    const lineEnd = currentIndex + line.length;
    
    // Check if selection intersects this line
    if (start <= lineEnd && end >= lineStart) {
      const selStart = Math.max(0, start - lineStart);
      const selEnd = Math.min(line.length, end - lineStart);
      
      const beforeSel = line.substring(0, selStart);
      const selection = line.substring(selStart, selEnd);
      
      const x = textX + ctx.measureText(beforeSel).width;
      const y = textY + lineIdx * lineHeight;
      const width = ctx.measureText(selection).width;
      
      rects.push({ x, y, width, height: lineHeight });
    }
    
    currentIndex = lineEnd + 1; // +1 for newline
  }
  
  ctx.restore();
  
  return rects;
}
