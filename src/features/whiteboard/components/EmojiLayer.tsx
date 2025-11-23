// ============================================================================
// EMOJI LAYER - Emoji Rendering with Transform Handles
// ============================================================================
// Renders emojis with selection handles, supports transforms
// ============================================================================

import { useRef, useEffect } from 'react';
import { useWhiteboardStore } from '../state/whiteboardStore';
import { worldToScreen } from '../utils/transform';
import { getViewportZoom } from '../utils/typeHelpers';
import { getSelectedEmoji } from '../tools/EmojiTool';
import { EMOJI_FONT_STACK } from '../types';
import type { EmojiObject, ViewportState } from '../types';

interface EmojiLayerProps {
  viewport: ViewportState;
  width: number;   // CSS pixels
  height: number;  // CSS pixels
}

export function EmojiLayer({ viewport, width, height }: EmojiLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const emojis = useWhiteboardStore((s) => s.emojis);
  const emojiUseTwemoji = useWhiteboardStore((s) => s.emojiUseTwemoji);
  const selectedEmoji = getSelectedEmoji();
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    
    // Backing store in device pixels
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    // Visual size in CSS pixels
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    // Reset + clear in device pixels
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // DPR-aware transform: draw in CSS pixels, scale to device pixels
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    // Viewport for screen conversions must use CSS width/height
    const viewportState: ViewportState = {
      ...viewport,
      width,
      height,
    };

    // Render all emojis (sorted by zIndex)
    const emojiArray = Array.from(emojis.values()).sort((a, b) => {
      const aZ = a.zIndex ?? 0;
      const bZ = b.zIndex ?? 0;
      return aZ - bZ;
    });
    
    emojiArray.forEach((emoji) => {
      renderEmoji(ctx, emoji, viewportState, emojiUseTwemoji);
    });
    
    // Render selection handles for selected emoji
    if (selectedEmoji) {
      renderSelectionHandles(ctx, selectedEmoji, viewportState);
    }
  }, [emojis, viewport, width, height, selectedEmoji, emojiUseTwemoji]);
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
      data-testid="emoji-layer"
    />
  );
}

// Render single emoji (screen space, CSS px)
function renderEmoji(
  ctx: CanvasRenderingContext2D,
  emoji: EmojiObject,
  viewport: ViewportState,
  useTwemoji: boolean
) {
  const screenPos = worldToScreen(
    { x: emoji.x, y: emoji.y },
    viewport
  );
  
  ctx.save();
  
  // Translate to emoji position in screen space
  ctx.translate(screenPos.x, screenPos.y);
  
  // Apply rotation
  ctx.rotate(emoji.rotation);
  
  // Size in CSS pixels; scales with viewport zoom and emoji.scale
  const baseSize = 48;
  const scaledSize = baseSize * emoji.scale * getViewportZoom(viewport);
  
  // Apply opacity
  ctx.globalAlpha = emoji.opacity;
  
  // Set font with emoji support
  ctx.font = `${scaledSize}px ${EMOJI_FONT_STACK}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Render emoji glyph
  const glyph = emoji.glyph || '❓'; // Fallback to question mark if undefined
  if (useTwemoji) {
    // TODO: Implement Twemoji rasterization fallback
    ctx.fillText(glyph, 0, 0);
  } else {
    ctx.fillText(glyph, 0, 0);
  }
  
  ctx.restore();
}

// Render selection handles around an emoji (screen space)
function renderSelectionHandles(
  ctx: CanvasRenderingContext2D,
  emoji: EmojiObject,
  viewport: ViewportState
) {
  const screenPos = worldToScreen(
    { x: emoji.x, y: emoji.y },
    viewport
  );
  
  ctx.save();
  
  // Translate to emoji position
  ctx.translate(screenPos.x, screenPos.y);
  
  // Apply rotation
  ctx.rotate(emoji.rotation);
  
  const baseSize = 48;
  const scaledSize = baseSize * emoji.scale * getViewportZoom(viewport);
  const halfSize = scaledSize / 2;
  
  // Draw bounding box
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(-halfSize, -halfSize, scaledSize, scaledSize);
  ctx.setLineDash([]);
  
  // Draw resize handles (corners)
  const handleSize = 12;
  const handles = [
    { x: -halfSize, y: -halfSize }, // NW
    { x: halfSize, y: -halfSize },  // NE
    { x: halfSize, y: halfSize },   // SE
    { x: -halfSize, y: halfSize },  // SW
  ];
  
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2;
  
  handles.forEach((handle) => {
    ctx.fillRect(
      handle.x - handleSize / 2,
      handle.y - handleSize / 2,
      handleSize,
      handleSize
    );
    ctx.strokeRect(
      handle.x - handleSize / 2,
      handle.y - handleSize / 2,
      handleSize,
      handleSize
    );
  });
  
  // Draw rotate handle (above emoji)
  const rotateHandleY = -halfSize - 30;
  ctx.beginPath();
  ctx.arc(0, rotateHandleY, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Draw line from emoji to rotate handle
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -halfSize);
  ctx.lineTo(0, rotateHandleY);
  ctx.stroke();
  
  ctx.restore();
}
