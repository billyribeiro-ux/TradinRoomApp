/**
 * PROFESSIONAL WHITEBOARD CANVAS - Microsoft L67+ Enterprise Grade
 * Complete rewrite with proper tool integration and performance optimizations
 * No browser prompts, proper layered rendering, spatial indexing for hit detection
 */

import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useWhiteboardStore } from '../state/whiteboardStore';

// Import tool handlers
import {
  activateHighlighterTool,
  deactivateHighlighterTool,
  handleHighlighterPointerDown,
  handleHighlighterPointerMove,
  handleHighlighterPointerUp
} from '../tools/HighlighterTool';

import {
  activateTextTool,
  deactivateTextTool,
  handleTextPointerDown,
  handleTextPointerMove,
  handleTextPointerUp,
  handleTextKeyDown,
  getTextEditState
} from '../tools/TextTool';

import type { 
  WhiteboardShape, 
  PenAnnotation,
  HighlighterAnnotation,
  TextAnnotation,
  ShapeObject,
  ViewportState
} from '../types';

// ============================================================================
// Types
// ============================================================================

interface Point {
  x: number;
  y: number;
}

interface CanvasLayer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

interface DrawingState {
  isDrawing: boolean;
  currentPath: Point[];
  startPoint: Point | null;
  tool: string;
  color: string;
  size: number;
  opacity: number;
}

interface WhiteboardCanvasProProps {
  width?: number;
  height?: number;
  canAnnotate?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const LAYER_CONFIG = {
  BACKGROUND: 0,
  SHAPES: 1,
  PREVIEW: 2,
  UI: 3,
} as const;

const RENDER_CONFIG = {
  DIRTY_RECT_PADDING: 10,
  SPATIAL_GRID_SIZE: 100,
  RAF_BATCH_SIZE: 5,
  DEBOUNCE_DELAY: 16,
} as const;

// ============================================================================
// Spatial Index for efficient hit detection
// ============================================================================

class SpatialIndex {
  private grid: Map<string, Set<string>>;
  private gridSize: number;
  private shapes: Map<string, WhiteboardShape>;

  constructor(gridSize: number = 100) {
    this.grid = new Map();
    this.gridSize = gridSize;
    this.shapes = new Map();
  }

  private getGridKey(x: number, y: number): string {
    const gridX = Math.floor(x / this.gridSize);
    const gridY = Math.floor(y / this.gridSize);
    return `${gridX},${gridY}`;
  }

  private getShapeBounds(shape: WhiteboardShape): { minX: number; minY: number; maxX: number; maxY: number } {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    if ('points' in shape && shape.points) {
      for (const point of shape.points) {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      }
    } else if (shape.type === 'text') {
      const text = shape as TextAnnotation;
      minX = text.x;
      minY = text.y;
      maxX = text.x + (text.width || 200);
      maxY = text.y + (text.height || 50);
    } else {
      minX = shape.x;
      minY = shape.y;
      maxX = shape.x + 100;
      maxY = shape.y + 100;
    }

    return { minX, minY, maxX, maxY };
  }

  add(shape: WhiteboardShape): void {
    this.shapes.set(shape.id, shape);
    const bounds = this.getShapeBounds(shape);

    for (let x = bounds.minX; x <= bounds.maxX; x += this.gridSize) {
      for (let y = bounds.minY; y <= bounds.maxY; y += this.gridSize) {
        const key = this.getGridKey(x, y);
        if (!this.grid.has(key)) {
          this.grid.set(key, new Set());
        }
        this.grid.get(key)!.add(shape.id);
      }
    }
  }

  remove(shapeId: string): void {
    const shape = this.shapes.get(shapeId);
    if (!shape) return;
    
    // Clean up grid cells to prevent memory leak
    const bounds = this.getShapeBounds(shape);
    for (let x = bounds.minX; x <= bounds.maxX; x += this.gridSize) {
      for (let y = bounds.minY; y <= bounds.maxY; y += this.gridSize) {
        const key = this.getGridKey(x, y);
        const cell = this.grid.get(key);
        if (cell) {
          cell.delete(shapeId);
          // Remove empty cells to prevent memory leak
          if (cell.size === 0) {
            this.grid.delete(key);
          }
        }
      }
    }
    
    // Remove from shapes map
    this.shapes.delete(shapeId);
  }

  getShapesNear(x: number, y: number, radius: number): WhiteboardShape[] {
    const nearbyShapes = new Set<string>();
    
    for (let dx = -radius; dx <= radius; dx += this.gridSize) {
      for (let dy = -radius; dy <= radius; dy += this.gridSize) {
        const key = this.getGridKey(x + dx, y + dy);
        const shapeIds = this.grid.get(key);
        if (shapeIds) {
          shapeIds.forEach(id => nearbyShapes.add(id));
        }
      }
    }

    return Array.from(nearbyShapes)
      .map(id => this.shapes.get(id))
      .filter(shape => shape !== undefined) as WhiteboardShape[];
  }

  clear(): void {
    this.grid.clear();
    this.shapes.clear();
  }

  rebuild(shapes: Map<string, WhiteboardShape>): void {
    this.clear();
    shapes.forEach(shape => this.add(shape));
  }
}

// ============================================================================
// Emoji Picker Component
// ============================================================================

const EmojiPicker: React.FC<{
  onSelect: (emoji: string) => void;
  onClose: () => void;
  position: Point;
}> = ({ onSelect, onClose, position }) => {
  const emojis = ['😀', '😍', '🎉', '👍', '❤️', '⭐', '✅', '❌', '⚠️', '💡', '🔥', '🎯', '📌', '🏆', '💯'];
  
  return (
    <div 
      className="absolute bg-white border-2 border-gray-300 rounded-lg shadow-xl p-2 grid grid-cols-5 gap-1 z-50"
      style={{ left: position.x, top: position.y }}
    >
      {emojis.map((emoji, index) => (
        <button
          key={index}
          className="text-2xl hover:bg-gray-100 rounded p-1 transition-colors"
          onClick={() => {
            onSelect(emoji);
            onClose();
          }}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export function WhiteboardCanvasPro({ 
  width, 
  height, 
  canAnnotate = true 
}: WhiteboardCanvasProProps = {}) {
  // Container ref for resize observer
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Canvas layers
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const shapesCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const uiCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Canvas contexts
  const [layers, setLayers] = useState<Map<number, CanvasLayer>>(new Map());
  
  // Drawing state
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    currentPath: [],
    startPoint: null,
    tool: '',
    color: '',
    size: 0,
    opacity: 1
  });
  
  // Tool-specific state
  const [isErasing, setIsErasing] = useState(false);
  const [eraserPosition, setEraserPosition] = useState<Point | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState<Point>({ x: 0, y: 0 });
  
  // Performance optimization
  const spatialIndex = useMemo(() => new SpatialIndex(RENDER_CONFIG.SPATIAL_GRID_SIZE), []);
  
  // Store state
  const tool = useWhiteboardStore((s) => s.tool);
  const color = useWhiteboardStore((s) => s.color);
  const size = useWhiteboardStore((s) => s.size);
  const opacity = useWhiteboardStore((s) => s.opacity);
  const shapes = useWhiteboardStore((s) => s.shapes);
  const viewport = useWhiteboardStore((s) => s.viewport);
  const addShape = useWhiteboardStore((s) => s.addShape);
  const deleteShape = useWhiteboardStore((s) => s.deleteShape);
  const clearShapes = useWhiteboardStore((s) => s.clearShapes);
  const undo = useWhiteboardStore((s) => s.undo);
  const redo = useWhiteboardStore((s) => s.redo);
  const eraserSize = useWhiteboardStore((s) => s.eraserSize);

  // ============================================================================
  // Canvas Setup
  // ============================================================================
  
  useEffect(() => {
    const canvases = [
      backgroundCanvasRef.current,
      shapesCanvasRef.current,
      previewCanvasRef.current,
      uiCanvasRef.current
    ];
    
    if (!canvases.every(c => c)) return;
    
    const updateCanvasSize = () => {
      const canvasWidth = width || window.innerWidth;
      const canvasHeight = height || window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      
      const newLayers = new Map<number, CanvasLayer>();
      
      canvases.forEach((canvas, index) => {
        if (!canvas) return;
        
        // Set actual size in memory
        canvas.width = canvasWidth * dpr;
        canvas.height = canvasHeight * dpr;
        
        // Set CSS size
        canvas.style.width = canvasWidth + 'px';
        canvas.style.height = canvasHeight + 'px';
        
        // Get context and scale for DPR
        const ctx = canvas.getContext('2d', {
          alpha: index !== LAYER_CONFIG.BACKGROUND,
          desynchronized: true,
          willReadFrequently: false
        });
        
        if (ctx) {
          ctx.scale(dpr, dpr);
          
          // Special setup for background
          if (index === LAYER_CONFIG.BACKGROUND) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
          }
          
          newLayers.set(index, { canvas, ctx });
        }
      });
      
      setLayers(newLayers);
    };
    
    updateCanvasSize();
    
    if (!width && !height) {
      window.addEventListener('resize', updateCanvasSize);
      return () => window.removeEventListener('resize', updateCanvasSize);
    }
    
    return undefined;
  }, [width, height]);

  // ============================================================================
  // Tool Activation/Deactivation
  // ============================================================================
  
  useEffect(() => {
    const canvas = shapesCanvasRef.current;
    if (!canvas) return;
    
    // Activate/deactivate tools based on selection
    switch (tool) {
      case 'highlighter':
        activateHighlighterTool(canvas);
        return () => deactivateHighlighterTool();
        
      case 'text':
        activateTextTool(canvas);
        return () => deactivateTextTool();
    }
    
    return undefined;
  }, [tool]);

  // ============================================================================
  // Viewport Transformation Helpers
  // ============================================================================
  
  const getViewportState = useCallback((): ViewportState => {
    return {
      x: viewport.panX,
      y: viewport.panY,
      scale: viewport.zoom
    };
  }, [viewport]);
  
  const screenToWorld = useCallback((screenX: number, screenY: number): Point => {
    const vp = getViewportState();
    return {
      x: (screenX - vp.x) / vp.scale,
      y: (screenY - vp.y) / vp.scale
    };
  }, [getViewportState]);

  // ============================================================================
  // Rendering Functions
  // ============================================================================
  
  const renderShape = useCallback((ctx: CanvasRenderingContext2D, shape: WhiteboardShape) => {
    ctx.save();
    
    // Apply viewport transformation
    const vp = getViewportState();
    ctx.translate(vp.x, vp.y);
    ctx.scale(vp.scale, vp.scale);
    
    switch (shape.type) {
      case 'pen': {
        const penShape = shape as PenAnnotation;
        if (penShape.points && penShape.points.length > 0) {
          ctx.globalAlpha = penShape.opacity;
          ctx.strokeStyle = penShape.color;
          ctx.lineWidth = penShape.thickness;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          if (penShape.points.length === 1) {
            ctx.beginPath();
            ctx.arc(penShape.points[0].x, penShape.points[0].y, penShape.thickness / 2, 0, 2 * Math.PI);
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.moveTo(penShape.points[0].x, penShape.points[0].y);
            for (let i = 1; i < penShape.points.length; i++) {
              ctx.lineTo(penShape.points[i].x, penShape.points[i].y);
            }
            ctx.stroke();
          }
        }
        break;
      }
      
      case 'highlighter': {
        const highlighterShape = shape as HighlighterAnnotation;
        if (highlighterShape.points && highlighterShape.points.length > 0) {
          ctx.globalAlpha = highlighterShape.opacity || 0.3;
          ctx.globalCompositeOperation = (highlighterShape.composite || 'multiply') as GlobalCompositeOperation;
          
          const gradientColor = highlighterShape.colorGradient?.stops?.[0]?.color || '#FFFF00';
          ctx.strokeStyle = gradientColor;
          ctx.fillStyle = gradientColor;
          ctx.lineWidth = highlighterShape.thickness;
          ctx.lineCap = highlighterShape.capStyle || 'round';
          ctx.lineJoin = highlighterShape.joinStyle || 'round';
          
          if (highlighterShape.points.length === 1) {
            ctx.beginPath();
            ctx.arc(
              highlighterShape.points[0].x, 
              highlighterShape.points[0].y, 
              highlighterShape.thickness / 2, 
              0, 
              2 * Math.PI
            );
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.moveTo(highlighterShape.points[0].x, highlighterShape.points[0].y);
            for (let i = 1; i < highlighterShape.points.length; i++) {
              ctx.lineTo(highlighterShape.points[i].x, highlighterShape.points[i].y);
            }
            ctx.stroke();
          }
          
          ctx.globalCompositeOperation = 'source-over';
        }
        break;
      }
      
      case 'text': {
        const textShape = shape as TextAnnotation;
        const editState = getTextEditState();
        
        ctx.globalAlpha = textShape.opacity;
        ctx.fillStyle = textShape.color;
        ctx.font = `${textShape.fontStyle === 'italic' ? 'italic ' : ''}${textShape.fontWeight || 400} ${textShape.fontSize}px ${textShape.fontFamily}`;
        ctx.textBaseline = 'top';
        
        // Use edit buffer if currently editing this text
        const content = (editState.isEditing && editState.textId === textShape.id) 
          ? editState.buffer 
          : textShape.content;
        
        // Handle multiline text
        const lines = content.split('\n');
        lines.forEach((line: string, i: number) => {
          ctx.fillText(line, textShape.x, textShape.y + i * (textShape.fontSize * (textShape.lineHeight || 1.5)));
        });
        
        // Draw cursor if editing this text
        if (editState.isEditing && editState.textId === textShape.id && editState.cursorVisible) {
          ctx.save();
          ctx.strokeStyle = textShape.color;
          ctx.lineWidth = 2;
          
          // Calculate cursor position
          const beforeCursor = content.substring(0, editState.cursorPosition);
          const cursorX = textShape.x + ctx.measureText(beforeCursor).width;
          const cursorY = textShape.y;
          
          ctx.beginPath();
          ctx.moveTo(cursorX, cursorY);
          ctx.lineTo(cursorX, cursorY + textShape.fontSize);
          ctx.stroke();
          ctx.restore();
        }
        break;
      }
      
      case 'rectangle':
      case 'circle':
      case 'arrow':
      case 'line': {
        const shapeObj = shape as ShapeObject;
        
        if (shape.type === 'rectangle' && shapeObj.points && shapeObj.points.length >= 2) {
          const start = shapeObj.points[0];
          const end = shapeObj.points[shapeObj.points.length - 1];
          const width = end.x - start.x;
          const height = end.y - start.y;
          
          ctx.globalAlpha = shapeObj.opacity;
          
          if (shapeObj.fill) {
            ctx.fillStyle = shapeObj.fill;
            ctx.fillRect(start.x, start.y, width, height);
          }
          
          if (shapeObj.stroke) {
            ctx.strokeStyle = shapeObj.stroke;
            ctx.lineWidth = shapeObj.strokeWidth || 2;
            ctx.strokeRect(start.x, start.y, width, height);
          }
        } else if (shape.type === 'circle' && shapeObj.points && shapeObj.points.length >= 2) {
          const center = shapeObj.points[0];
          const edge = shapeObj.points[shapeObj.points.length - 1];
          const radius = Math.sqrt(
            Math.pow(edge.x - center.x, 2) + 
            Math.pow(edge.y - center.y, 2)
          );
          
          ctx.globalAlpha = shapeObj.opacity;
          
          ctx.beginPath();
          ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
          
          if (shapeObj.fill) {
            ctx.fillStyle = shapeObj.fill;
            ctx.fill();
          }
          
          if (shapeObj.stroke) {
            ctx.strokeStyle = shapeObj.stroke;
            ctx.lineWidth = shapeObj.strokeWidth || 2;
            ctx.stroke();
          }
        } else if ((shape.type === 'arrow' || shape.type === 'line') && shapeObj.points && shapeObj.points.length >= 2) {
          const start = shapeObj.points[0];
          const end = shapeObj.points[shapeObj.points.length - 1];
          
          ctx.globalAlpha = shapeObj.opacity;
          ctx.strokeStyle = shapeObj.stroke || '#000000';
          ctx.lineWidth = shapeObj.strokeWidth || 2;
          ctx.lineCap = 'round';
          
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
          
          if (shape.type === 'arrow') {
            const angle = Math.atan2(end.y - start.y, end.x - start.x);
            const headLength = (shapeObj.strokeWidth || 2) * 5;
            
            ctx.fillStyle = shapeObj.stroke || '#000000';
            ctx.beginPath();
            ctx.moveTo(end.x, end.y);
            ctx.lineTo(
              end.x - headLength * Math.cos(angle - Math.PI / 6),
              end.y - headLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
              end.x - headLength * Math.cos(angle + Math.PI / 6),
              end.y - headLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fill();
          }
        }
        break;
      }
    }
    
    ctx.restore();
  }, [getViewportState, getTextEditState]);
  
  const renderShapesLayer = useCallback(() => {
    const layer = layers.get(LAYER_CONFIG.SHAPES);
    if (!layer) return;
    
    const { ctx, canvas } = layer;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Render all shapes
    shapes.forEach(shape => {
      renderShape(ctx, shape);
    });
  }, [layers, shapes, renderShape]);
  
  const renderPreviewLayer = useCallback(() => {
    const layer = layers.get(LAYER_CONFIG.PREVIEW);
    if (!layer) return;
    
    const { ctx, canvas } = layer;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!drawingState.isDrawing || drawingState.currentPath.length === 0) return;
    
    ctx.save();
    
    const vp = getViewportState();
    ctx.translate(vp.x, vp.y);
    ctx.scale(vp.scale, vp.scale);
    
    ctx.globalAlpha = drawingState.opacity;
    ctx.strokeStyle = drawingState.color;
    ctx.lineWidth = drawingState.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Preview based on tool
    const start = drawingState.startPoint;
    const current = drawingState.currentPath[drawingState.currentPath.length - 1];
    
    switch (drawingState.tool) {
      case 'rectangle':
        if (start) {
          const width = current.x - start.x;
          const height = current.y - start.y;
          ctx.strokeRect(start.x, start.y, width, height);
        }
        break;
        
      case 'circle':
        if (start) {
          const radius = Math.sqrt(
            Math.pow(current.x - start.x, 2) + 
            Math.pow(current.y - start.y, 2)
          );
          ctx.beginPath();
          ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
        }
        break;
        
      case 'arrow':
      case 'line':
        if (start) {
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(current.x, current.y);
          ctx.stroke();
          
          if (drawingState.tool === 'arrow') {
            const angle = Math.atan2(current.y - start.y, current.x - start.x);
            const headLength = drawingState.size * 5;
            
            ctx.fillStyle = drawingState.color;
            ctx.beginPath();
            ctx.moveTo(current.x, current.y);
            ctx.lineTo(
              current.x - headLength * Math.cos(angle - Math.PI / 6),
              current.y - headLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
              current.x - headLength * Math.cos(angle + Math.PI / 6),
              current.y - headLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fill();
          }
        }
        break;
        
      case 'pen':
        if (drawingState.currentPath.length > 1) {
          ctx.beginPath();
          ctx.moveTo(drawingState.currentPath[0].x, drawingState.currentPath[0].y);
          for (let i = 1; i < drawingState.currentPath.length; i++) {
            ctx.lineTo(drawingState.currentPath[i].x, drawingState.currentPath[i].y);
          }
          ctx.stroke();
        } else if (drawingState.currentPath.length === 1) {
          ctx.beginPath();
          ctx.arc(
            drawingState.currentPath[0].x,
            drawingState.currentPath[0].y,
            drawingState.size / 2,
            0,
            2 * Math.PI
          );
          ctx.fill();
        }
        break;
    }
    
    ctx.restore();
  }, [layers, drawingState, getViewportState]);
  
  const renderUILayer = useCallback(() => {
    const layer = layers.get(LAYER_CONFIG.UI);
    if (!layer) return;
    
    const { ctx, canvas } = layer;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Render eraser cursor
    if (tool === 'eraser' && eraserPosition) {
      ctx.save();
      
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      
      ctx.beginPath();
      ctx.arc(eraserPosition.x, eraserPosition.y, eraserSize, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.fill();
      
      // Center dot
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(eraserPosition.x, eraserPosition.y, 2, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.restore();
    }
  }, [layers, tool, eraserPosition, eraserSize]);

  // ============================================================================
  // Effects for rendering
  // ============================================================================
  
  // Update spatial index when shapes change
  useEffect(() => {
    spatialIndex.rebuild(shapes);
  }, [shapes, spatialIndex]);
  
  // Render shapes layer when shapes change
  useEffect(() => {
    renderShapesLayer();
  }, [shapes, renderShapesLayer]);
  
  // Render preview layer when drawing state changes
  useEffect(() => {
    renderPreviewLayer();
  }, [drawingState, renderPreviewLayer]);
  
  // Render UI layer when needed
  useEffect(() => {
    renderUILayer();
  }, [eraserPosition, tool, renderUILayer]);

  // ============================================================================
  // Resize Observer to handle canvas dimension changes
  // ============================================================================
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newWidth, height: newHeight } = entry.contentRect;
        
        // Update all canvas dimensions
        const canvases = [
          backgroundCanvasRef.current,
          shapesCanvasRef.current,
          previewCanvasRef.current,
          uiCanvasRef.current
        ];
        
        canvases.forEach(canvas => {
          if (canvas) {
            const dpr = window.devicePixelRatio || 1;
            
            // Update CSS dimensions
            canvas.style.width = `${newWidth}px`;
            canvas.style.height = `${newHeight}px`;
            
            // Update canvas buffer dimensions
            canvas.width = newWidth * dpr;
            canvas.height = newHeight * dpr;
            
            // Update context scale
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.scale(dpr, dpr);
            }
          }
        });
        
        // Update viewport in store
        const viewport = useWhiteboardStore.getState().viewport;
        useWhiteboardStore.getState().updateViewport({
          ...viewport,
          canvasWidth: newWidth,
          canvasHeight: newHeight,
          dpr: window.devicePixelRatio || 1
        });
        
        // Re-render all layers
        renderShapesLayer();
        renderUILayer();
      }
    });
    
    observer.observe(container);
    
    return () => observer.disconnect();
  }, [renderShapesLayer, renderUILayer]);

  // ============================================================================
  // Event Handlers
  // ============================================================================
  
  const getMousePos = useCallback((e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = shapesCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]?.clientX || 0 : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY || 0 : e.clientY;
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);
  
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!canAnnotate) return;
    
    const canvas = shapesCanvasRef.current;
    if (!canvas) return;
    
    const screenPos = getMousePos(e);
    const worldPos = screenToWorld(screenPos.x, screenPos.y);
    const viewportState = getViewportState();
    
    // Delegate to tool handlers
    switch (tool) {
      case 'highlighter':
        if (handleHighlighterPointerDown(e.nativeEvent, canvas, viewportState)) {
          e.preventDefault();
          return;
        }
        break;
        
      case 'text':
        if (handleTextPointerDown(e.nativeEvent, canvas, viewportState)) {
          e.preventDefault();
          return;
        }
        break;
        
      case 'emoji':
        setEmojiPickerPosition(screenPos);
        setShowEmojiPicker(true);
        e.preventDefault();
        return;
        
      case 'eraser':
        setIsErasing(true);
        eraseAtPosition(worldPos);
        e.preventDefault();
        return;
        
      case 'pen':
      case 'rectangle':
      case 'circle':
      case 'arrow':
      case 'line':
        setDrawingState({
          isDrawing: true,
          currentPath: [worldPos],
          startPoint: worldPos,
          tool,
          color,
          size,
          opacity
        });
        e.preventDefault();
        return;
    }
  }, [tool, color, size, opacity, canAnnotate, getMousePos, screenToWorld, getViewportState]);
  
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const canvas = shapesCanvasRef.current;
    if (!canvas) return;
    
    const screenPos = getMousePos(e);
    const worldPos = screenToWorld(screenPos.x, screenPos.y);
    const viewportState = getViewportState();
    
    // Update eraser cursor
    if (tool === 'eraser') {
      setEraserPosition(screenPos);
      if (isErasing) {
        eraseAtPosition(worldPos);
      }
    }
    
    // Delegate to tool handlers
    switch (tool) {
      case 'highlighter':
        if (handleHighlighterPointerMove(e.nativeEvent, canvas, viewportState)) {
          e.preventDefault();
        }
        break;
        
      case 'text':
        if (handleTextPointerMove(e.nativeEvent, canvas, viewportState)) {
          e.preventDefault();
        }
        break;
    }
    
    // Handle regular drawing
    if (drawingState.isDrawing) {
      if (tool === 'pen') {
        setDrawingState(prev => ({
          ...prev,
          currentPath: [...prev.currentPath, worldPos]
        }));
      } else if (tool === 'rectangle' || tool === 'circle' || tool === 'arrow' || tool === 'line') {
        setDrawingState(prev => ({
          ...prev,
          currentPath: [prev.startPoint!, worldPos]
        }));
      }
      e.preventDefault();
    }
  }, [tool, isErasing, drawingState.isDrawing, getMousePos, screenToWorld, getViewportState]);
  
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const canvas = shapesCanvasRef.current;
    if (!canvas) return;
    
    // Stop erasing
    if (tool === 'eraser') {
      setIsErasing(false);
      return;
    }
    
    // Delegate to tool handlers
    switch (tool) {
      case 'highlighter':
        if (handleHighlighterPointerUp(e.nativeEvent, canvas)) {
          e.preventDefault();
          return;
        }
        break;
        
      case 'text':
        if (handleTextPointerUp(e.nativeEvent, canvas)) {
          e.preventDefault();
          return;
        }
        break;
    }
    
    // Commit drawing
    if (drawingState.isDrawing) {
      commitDrawing();
      setDrawingState({
        isDrawing: false,
        currentPath: [],
        startPoint: null,
        tool: '',
        color: '',
        size: 0,
        opacity: 1
      });
    }
  }, [tool, drawingState, getViewportState]);
  
  const commitDrawing = useCallback(() => {
    if (drawingState.currentPath.length < 1) return;
    
    const now = Date.now();
    
    switch (drawingState.tool) {
      case 'pen': {
        if (drawingState.currentPath.length < 2) return;
        const penShape: PenAnnotation = {
          id: `pen-${now}`,
          type: 'pen',
          points: drawingState.currentPath,
          color: drawingState.color,
          thickness: drawingState.size,
          opacity: drawingState.opacity,
          x: drawingState.startPoint?.x || 0,
          y: drawingState.startPoint?.y || 0,
          scale: 1,
          rotation: 0,
          locked: false,
          createdAt: now,
          updatedAt: now
        };
        addShape(penShape);
        break;
      }
      
      case 'rectangle':
      case 'circle':
      case 'arrow':
      case 'line': {
        if (drawingState.currentPath.length < 2) return;
        const shapeObj: ShapeObject = {
          id: `${drawingState.tool}-${now}`,
          type: drawingState.tool as 'rectangle' | 'circle' | 'arrow' | 'line',
          points: drawingState.currentPath,
          stroke: drawingState.color,
          strokeWidth: drawingState.size,
          opacity: drawingState.opacity,
          x: drawingState.startPoint?.x || 0,
          y: drawingState.startPoint?.y || 0,
          scale: 1,
          rotation: 0,
          locked: false,
          createdAt: now,
          updatedAt: now
        };
        addShape(shapeObj);
        break;
      }
    }
  }, [drawingState, addShape]);
  
  const eraseAtPosition = useCallback((pos: Point) => {
    const nearbyShapes = spatialIndex.getShapesNear(pos.x, pos.y, eraserSize);
    const shapesToDelete: string[] = [];
    
    nearbyShapes.forEach(shape => {
      // More precise hit detection
      if (shape.type === 'text') {
        const text = shape as TextAnnotation;
        if (Math.abs(text.x - pos.x) < eraserSize && Math.abs(text.y - pos.y) < eraserSize) {
          shapesToDelete.push(shape.id);
        }
      } else if ('points' in shape && shape.points) {
        for (const point of shape.points) {
          const distance = Math.sqrt(
            Math.pow(point.x - pos.x, 2) + 
            Math.pow(point.y - pos.y, 2)
          );
          if (distance < eraserSize) {
            shapesToDelete.push(shape.id);
            break;
          }
        }
      }
    });
    
    shapesToDelete.forEach(id => deleteShape(id));
  }, [spatialIndex, eraserSize, deleteShape]);
  
  const handleEmojiSelect = useCallback((emoji: string) => {
    const pos = screenToWorld(emojiPickerPosition.x, emojiPickerPosition.y);
    const textShape: TextAnnotation = {
      id: `emoji-${Date.now()}`,
      type: 'text',
      content: emoji,
      x: pos.x,
      y: pos.y,
      color: '#000000',
      opacity: 1,
      fontSize: 48,
      fontFamily: 'Apple Color Emoji, Segoe UI Emoji, sans-serif',
      fontWeight: 400,
      fontStyle: 'normal',
      lineHeight: 1,
      textAlign: 'left',
      scale: 1,
      rotation: 0,
      locked: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    addShape(textShape);
  }, [emojiPickerPosition, screenToWorld, addShape]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delegate to text tool if active
      if (tool === 'text' && handleTextKeyDown(e)) {
        return;
      }
      
      // Global shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          redo();
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          clearShapes();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tool, undo, redo, clearShapes]);
  
  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* Background Layer */}
      <canvas
        ref={backgroundCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
      
      {/* Shapes Layer */}
      <canvas
        ref={shapesCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
      
      {/* Preview Layer */}
      <canvas
        ref={previewCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
      
      {/* UI Layer */}
      <canvas
        ref={uiCanvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          cursor: tool === 'pen' ? 'crosshair' :
                  tool === 'highlighter' ? 'crosshair' :
                  tool === 'eraser' ? 'none' :
                  tool === 'text' ? 'text' :
                  tool === 'pan' ? 'move' :
                  tool === 'zoom' ? 'zoom-in' :
                  tool === 'select' ? 'default' :
                  tool === 'rectangle' ? 'crosshair' :
                  tool === 'circle' ? 'crosshair' :
                  tool === 'arrow' ? 'crosshair' :
                  tool === 'line' ? 'crosshair' :
                  tool === 'emoji' ? 'copy' :
                  tool === 'laser' ? 'pointer' :
                  'crosshair'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          setEraserPosition(null);
          setIsErasing(false);
        }}
        data-testid="whiteboard-canvas"
      />
      
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <EmojiPicker
          position={emojiPickerPosition}
          onSelect={handleEmojiSelect}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}
    </div>
  );
}