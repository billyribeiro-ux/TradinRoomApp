// ============================================================================
// SELECT TOOL - Shape selection and manipulation
// ============================================================================

import type { ViewportTransform, WhiteboardShape, WhiteboardPoint } from '../types';
import { screenToWorld } from '../utils/transform';
import { useWhiteboardStore } from '../state/whiteboardStore';

interface SelectionBox {
  start: WhiteboardPoint;
  end: WhiteboardPoint;
}

interface SelectState {
  active: boolean;
  selecting: boolean;
  dragging: boolean;
  selectionBox: SelectionBox | null;
  dragStart: WhiteboardPoint | null;
  selectedShapes: Set<string>;
  lastClickTime: number;
  lastClickTarget: string | null;
}

const toolState: SelectState = {
  active: false,
  selecting: false,
  dragging: false,
  selectionBox: null,
  dragStart: null,
  selectedShapes: new Set(),
  lastClickTime: 0,
  lastClickTarget: null
};

export function activateSelectTool(): void {
  toolState.active = true;
  toolState.selectedShapes = new Set();
}

export function deactivateSelectTool(): void {
  toolState.active = false;
  toolState.selectedShapes.clear();
  toolState.selectionBox = null;
  
  const store = useWhiteboardStore.getState();
  store.clearSelection();
}

function hitTestShape(shape: WhiteboardShape, point: WhiteboardPoint): boolean {
  // Simple bounding box hit test
  const TOLERANCE = 10;
  
  if (shape.type === 'text') {
    const width = (shape as any).width || 100;
    const height = (shape as any).height || 30;
    return point.x >= shape.x - TOLERANCE &&
           point.x <= shape.x + width + TOLERANCE &&
           point.y >= shape.y - TOLERANCE &&
           point.y <= shape.y + height + TOLERANCE;
  }
  
  if ('points' in shape && shape.points) {
    // Check if near any point
    for (const pt of shape.points) {
      const dx = point.x - pt.x;
      const dy = point.y - pt.y;
      if (Math.sqrt(dx * dx + dy * dy) < TOLERANCE) {
        return true;
      }
    }
  }
  
  // Default bounding box
  return point.x >= shape.x - TOLERANCE &&
         point.x <= shape.x + 100 + TOLERANCE &&
         point.y >= shape.y - TOLERANCE &&
         point.y <= shape.y + 100 + TOLERANCE;
}

export function handleSelectPointerDown(
  e: PointerEvent,
  canvas: HTMLCanvasElement,
  viewportTransform: ViewportTransform
): boolean {
  if (!toolState.active) return false;
  if (e.button !== 0) return false; // Primary button only
  
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  
  const worldPoint = screenToWorld(x, y, {
    x: viewportTransform.panX,
    y: viewportTransform.panY,
    scale: viewportTransform.zoom,
    width: rect.width,
    height: rect.height
  });
  
  if (!worldPoint) return false;
  
  const store = useWhiteboardStore.getState();
  const shapes = store.shapes;
  
  // Check for shape hit
  let hitShape: WhiteboardShape | null = null;
  shapes.forEach(shape => {
    if (hitTestShape(shape, worldPoint)) {
      hitShape = shape;
    }
  });
  
  if (hitShape !== null) {
    const shape = hitShape as WhiteboardShape; // Explicit type assertion
    // Check for double-click on text
    const now = Date.now();
    if ('type' in shape && shape.type === 'text' && 
        now - toolState.lastClickTime < 300 && 
        'id' in shape && toolState.lastClickTarget === shape.id) {
      // Trigger text edit
      store.setEditingTextId(shape.id);
      return true;
    }
    
    toolState.lastClickTime = now;
    if ('id' in shape) {
      toolState.lastClickTarget = shape.id;
      
      // Select shape
      if (!e.shiftKey) {
        toolState.selectedShapes.clear();
      }
      toolState.selectedShapes.add(shape.id);
      store.setSelectedShapeIds(toolState.selectedShapes);
    }
    
    // Start drag
    toolState.dragging = true;
    toolState.dragStart = worldPoint;
  } else {
    // Start selection box
    if (!e.shiftKey) {
      toolState.selectedShapes.clear();
      store.setSelectedShapeIds(toolState.selectedShapes);
    }
    
    toolState.selecting = true;
    toolState.selectionBox = {
      start: worldPoint,
      end: worldPoint
    };
  }
  
  return true;
}

export function handleSelectPointerMove(
  e: PointerEvent,
  canvas: HTMLCanvasElement,
  viewportTransform: ViewportTransform
): boolean {
  if (!toolState.active) return false;
  
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  
  const worldPoint = screenToWorld(x, y, {
    x: viewportTransform.panX,
    y: viewportTransform.panY,
    scale: viewportTransform.zoom,
    width: rect.width,
    height: rect.height
  });
  
  if (!worldPoint) return false;
  
  if (toolState.selecting && toolState.selectionBox) {
    // Update selection box
    toolState.selectionBox.end = worldPoint;
    
    // Find shapes in box
    const store = useWhiteboardStore.getState();
    const shapes = store.shapes;
    const newSelection = new Set<string>();
    
    const minX = Math.min(toolState.selectionBox.start.x, toolState.selectionBox.end.x);
    const maxX = Math.max(toolState.selectionBox.start.x, toolState.selectionBox.end.x);
    const minY = Math.min(toolState.selectionBox.start.y, toolState.selectionBox.end.y);
    const maxY = Math.max(toolState.selectionBox.start.y, toolState.selectionBox.end.y);
    
    shapes.forEach(shape => {
      if (shape.x >= minX && shape.x <= maxX &&
          shape.y >= minY && shape.y <= maxY) {
        newSelection.add(shape.id);
      }
    });
    
    toolState.selectedShapes = newSelection;
    store.setSelectedShapeIds(toolState.selectedShapes);
  }
  
  if (toolState.dragging && toolState.dragStart) {
    // Move selected shapes
    const dx = worldPoint.x - toolState.dragStart.x;
    const dy = worldPoint.y - toolState.dragStart.y;
    
    const store = useWhiteboardStore.getState();
    toolState.selectedShapes.forEach(shapeId => {
      const shape = store.shapes.get(shapeId);
      if (shape) {
        store.updateShape(shapeId, {
          x: shape.x + dx,
          y: shape.y + dy,
          updatedAt: Date.now()
        });
      }
    });
    
    toolState.dragStart = worldPoint;
  }
  
  return true;
}

export function handleSelectPointerUp(
  _e: PointerEvent,
  _canvas: HTMLCanvasElement,
  _viewportTransform: ViewportTransform
): boolean {
  if (!toolState.active) return false;
  
  toolState.selecting = false;
  toolState.dragging = false;
  toolState.selectionBox = null;
  toolState.dragStart = null;
  
  return true;
}

export function handleSelectKeyDown(e: KeyboardEvent): boolean {
  if (!toolState.active) return false;
  
  const store = useWhiteboardStore.getState();
  
  // Delete selected shapes
  if ((e.key === 'Delete' || e.key === 'Backspace') && toolState.selectedShapes.size > 0) {
    toolState.selectedShapes.forEach(shapeId => {
      store.deleteShape(shapeId);
    });
    toolState.selectedShapes.clear();
    store.setSelectedShapeIds(toolState.selectedShapes);
    return true;
  }
  
  // Select all
  if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
    e.preventDefault();
    const allShapeIds = new Set(store.shapes.keys());
    toolState.selectedShapes = allShapeIds;
    store.setSelectedShapeIds(toolState.selectedShapes);
    return true;
  }
  
  // Escape to clear selection
  if (e.key === 'Escape') {
    toolState.selectedShapes.clear();
    store.setSelectedShapeIds(toolState.selectedShapes);
    return true;
  }
  
  return false;
}

export function drawSelectionBox(
  ctx: CanvasRenderingContext2D,
  viewportTransform: ViewportTransform
): void {
  if (!toolState.selectionBox || !toolState.selecting) return;
  
  ctx.save();
  
  // Apply viewport transform
  ctx.translate(viewportTransform.panX, viewportTransform.panY);
  ctx.scale(viewportTransform.zoom, viewportTransform.zoom);
  
  const { start, end } = toolState.selectionBox;
  const width = end.x - start.x;
  const height = end.y - start.y;
  
  ctx.strokeStyle = '#2E9BFF';
  ctx.lineWidth = 1 / viewportTransform.zoom;
  ctx.setLineDash([5 / viewportTransform.zoom, 5 / viewportTransform.zoom]);
  ctx.strokeRect(start.x, start.y, width, height);
  
  ctx.fillStyle = 'rgba(46, 155, 255, 0.1)';
  ctx.fillRect(start.x, start.y, width, height);
  
  ctx.restore();
}
