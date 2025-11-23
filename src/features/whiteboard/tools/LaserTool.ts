// ============================================================================
// LASER TOOL - Temporary pointer for presentations
// ============================================================================

import type { ViewportTransform } from '../types';
import { screenToWorld } from '../utils/transform';
import { useWhiteboardStore } from '../state/whiteboardStore';

interface LaserState {
  active: boolean;
  trail: Array<{ x: number; y: number; timestamp: number }>;
  fadeTimer: NodeJS.Timeout | null;
}

const toolState: LaserState = {
  active: false,
  trail: [],
  fadeTimer: null
};

const TRAIL_LENGTH = 20;
const FADE_DELAY = 500;

export function activateLaserTool(): void {
  toolState.active = true;
  toolState.trail = [];
}

export function deactivateLaserTool(): void {
  toolState.active = false;
  toolState.trail = [];
  if (toolState.fadeTimer) {
    clearTimeout(toolState.fadeTimer);
    toolState.fadeTimer = null;
  }
}

export function handleLaserPointerDown(
  e: PointerEvent,
  canvas: HTMLCanvasElement,
  viewportTransform: ViewportTransform
): boolean {
  if (!toolState.active) return false;
  
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const worldPoint = screenToWorld(x, y, {
    x: viewportTransform.panX,
    y: viewportTransform.panY,
    scale: viewportTransform.zoom,
    width: rect.width,
    height: rect.height
  });
  
  if (!worldPoint) return false;
  
  // Start new trail
  toolState.trail = [{
    x: worldPoint.x,
    y: worldPoint.y,
    timestamp: Date.now()
  }];
  
  // Broadcast laser position
  const store = useWhiteboardStore.getState();
  store.setLaserVisible(true);
  store.setLaserTrail(toolState.trail);
  
  return true;
}

export function handleLaserPointerMove(
  e: PointerEvent,
  canvas: HTMLCanvasElement,
  viewportTransform: ViewportTransform
): boolean {
  if (!toolState.active || toolState.trail.length === 0) return false;
  
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const worldPoint = screenToWorld(x, y, {
    x: viewportTransform.panX,
    y: viewportTransform.panY,
    scale: viewportTransform.zoom,
    width: rect.width,
    height: rect.height
  });
  
  if (!worldPoint) return false;
  
  // Add to trail
  toolState.trail.push({
    x: worldPoint.x,
    y: worldPoint.y,
    timestamp: Date.now()
  });
  
  // Keep trail length limited
  if (toolState.trail.length > TRAIL_LENGTH) {
    toolState.trail = toolState.trail.slice(-TRAIL_LENGTH);
  }
  
  // Update store
  const store = useWhiteboardStore.getState();
  store.setLaserTrail(toolState.trail);
  
  return true;
}

export function handleLaserPointerUp(
  _e: PointerEvent,
  _canvas: HTMLCanvasElement,
  _viewportTransform: ViewportTransform
): boolean {
  if (!toolState.active) return false;
  
  // Start fade timer
  if (toolState.fadeTimer) {
    clearTimeout(toolState.fadeTimer);
  }
  
  toolState.fadeTimer = setTimeout(() => {
    toolState.trail = [];
    const store = useWhiteboardStore.getState();
    store.setLaserVisible(false);
    store.setLaserTrail([]);
  }, FADE_DELAY);
  
  return true;
}

export function handleLaserKeyDown(e: KeyboardEvent): boolean {
  if (!toolState.active) return false;
  
  if (e.key === 'Escape') {
    deactivateLaserTool();
    return true;
  }
  
  return false;
}

export function drawLaserPointer(
  ctx: CanvasRenderingContext2D,
  viewportTransform: ViewportTransform
): void {
  if (toolState.trail.length === 0) return;
  
  // const now = Date.now(); // Reserved for future animation
  const store = useWhiteboardStore.getState();
  const color = store.laserColor || '#FF0000';
  
  ctx.save();
  
  // Apply viewport transform
  ctx.translate(viewportTransform.panX, viewportTransform.panY);
  ctx.scale(viewportTransform.zoom, viewportTransform.zoom);
  
  // Draw trail
  ctx.beginPath();
  toolState.trail.forEach((point, index) => {
    // Age-based fading removed for simplicity
    // const age = now - point.timestamp;
    // const opacity = Math.max(0, 1 - age / 1000);
    
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 3 / viewportTransform.zoom;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = 0.8;
  ctx.stroke();
  
  // Draw pointer dot at current position
  if (toolState.trail.length > 0) {
    const lastPoint = toolState.trail[toolState.trail.length - 1];
    ctx.beginPath();
    ctx.arc(lastPoint.x, lastPoint.y, 5 / viewportTransform.zoom, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = 1;
    ctx.fill();
  }
  
  ctx.restore();
}
