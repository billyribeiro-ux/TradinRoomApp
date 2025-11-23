// ============================================================================
// WHITEBOARD STORE - Microsoft L67+ Enterprise Grade Zustand Implementation
// ============================================================================
// Single Source of Truth (SSOT) with performance optimizations
// ============================================================================
// Version: 2.0.0
// Last Updated: 2025-01-18
// ============================================================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import { devtools } from 'zustand/middleware';

// Enable Immer support for Map and Set data structures
enableMapSet();
import type {
  WhiteboardTool,
  WhiteboardShape,
  EmojiObject,
  WhiteboardHistoryEntry,
  ViewportTransform,
  RemoteCursor,
  WhiteboardConfig,
} from '../types';
import { DEFAULT_WHITEBOARD_CONFIG } from '../types';

// ============================================================================
// Enhanced Type Definitions
// ============================================================================

interface ViewportTransformWithDPR extends ViewportTransform {
  dpr: number;                    // Device pixel ratio
  canvasWidth: number;            // Canvas CSS width
  canvasHeight: number;           // Canvas CSS height
  worldBounds?: {                 // Optional world bounds for infinite canvas
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}

interface PerformanceMetrics {
  lastFrameTime: number;
  fps: number;
  shapeCount: number;
  visibleShapeCount: number;
  renderTime: number;
  inputLatency: number;
}

interface BatchUpdate {
  shapes?: Map<string, WhiteboardShape>;
  emojis?: Map<string, EmojiObject>;
  selectedShapeIds?: Set<string>;
  timestamp: number;
}

interface WhiteboardStore {
  // ============================================================================
  // Core State
  // ============================================================================
  
  // Tool State
  tool: WhiteboardTool;
  color: string;
  size: number;
  opacity: number;
  
  // Canvas State
  shapes: Map<string, WhiteboardShape>;
  emojis: Map<string, EmojiObject>;
  selectedShapeIds: Set<string>;
  
  // History State
  history: WhiteboardHistoryEntry[];
  historyIndex: number;
  maxHistorySize: number;
  
  // Enhanced Viewport State with DPR
  viewport: ViewportTransformWithDPR;
  
  // Collaboration State
  remoteCursors: Map<string, RemoteCursor>;
  localCursorId: string | null;
  
  // Config
  config: WhiteboardConfig;
  
  // ============================================================================
  // Performance State
  // ============================================================================
  
  performance: PerformanceMetrics;
  pendingBatchUpdate: BatchUpdate | null;
  batchUpdateTimer: NodeJS.Timeout | null;
  renderQuality: 'low' | 'medium' | 'high' | 'auto';
  enableGPUAcceleration: boolean;
  
  // ============================================================================
  // Mode & Recording State
  // ============================================================================
  
  mode: 'whiteboard' | 'presenter' | 'viewer';
  recordInkInOutput: boolean;
  background: string | null;
  isRecording: boolean;
  recordingStartTime: number | null;
  
  // ============================================================================
  // Tool-Specific State
  // ============================================================================
  
  // Eraser State
  eraserMode: 'stroke' | 'area' | 'smart';
  eraserSize: number;
  
  // Text Formatting State
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline' | 'line-through';
  textAlign: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number;
  letterSpacing: number;
  
  // Stamp/Emoji State
  emojiDebug: boolean;
  emojiSnapToGrid: boolean;
  emojiUseTwemoji: boolean;
  emojiSize: number;
  
  // Laser Pointer State
  laserTrail: Array<{ x: number; y: number; timestamp: number }>;
  laserVisible: boolean;
  laserColor: string;
  
  // ============================================================================
  // Actions - Tool Management
  // ============================================================================
  
  setTool: (tool: WhiteboardTool) => void;
  setColor: (color: string) => void;
  setSize: (size: number) => void;
  setOpacity: (opacity: number) => void;
  
  // ============================================================================
  // Actions - Shape Management (with batching)
  // ============================================================================
  
  addShape: (shape: WhiteboardShape) => void;
  addShapes: (shapes: WhiteboardShape[]) => void;
  updateShape: (id: string, updates: Partial<WhiteboardShape>) => void;
  updateShapes: (updates: Map<string, Partial<WhiteboardShape>>) => void;
  deleteShape: (id: string) => void;
  deleteShapes: (ids: string[]) => void;
  clearShapes: () => void;
  
  // Batch operations for performance
  batchUpdate: (updates: Partial<BatchUpdate>) => void;
  flushBatchUpdate: () => void;
  
  // ============================================================================
  // Actions - Selection
  // ============================================================================
  
  selectShape: (id: string) => void;
  selectShapes: (ids: string[]) => void;
  setSelectedShapeIds: (ids: Set<string>) => void; // For compatibility
  deselectShape: (id: string) => void;
  deselectShapes: (ids: string[]) => void;
  clearSelection: () => void;
  selectAll: () => void;
  
  // Text editing
  setEditingTextId: (id: string | null) => void;
  
  // ============================================================================
  // Actions - History (with compression)
  // ============================================================================
  
  undo: () => void;
  redo: () => void;
  saveHistory: (action: string, metadata?: Record<string, any>) => void;
  pushHistory: (action: string, metadata?: Record<string, any>) => void; // Alias for saveHistory
  compressHistory: () => void;
  clearHistory: () => void;
  
  // ============================================================================
  // Actions - Viewport (with DPR support)
  // ============================================================================
  
  setPan: (panX: number, panY: number) => void;
  setZoom: (zoom: number, focalX?: number, focalY?: number) => void;
  resetViewport: () => void;
  fitToContent: () => void;
  updateDPR: (dpr: number) => void;
  setCanvasSize: (width: number, height: number) => void;
  updateViewport: (viewport: Partial<ViewportTransformWithDPR>) => void;
  
  // ============================================================================
  // Actions - Collaboration
  // ============================================================================
  
  updateRemoteCursor: (userId: string, cursor: RemoteCursor) => void;
  removeRemoteCursor: (userId: string) => void;
  clearRemoteCursors: () => void;
  setLocalCursorId: (id: string | null) => void;
  
  // ============================================================================
  // Actions - Performance
  // ============================================================================
  
  updatePerformanceMetrics: (metrics: Partial<PerformanceMetrics>) => void;
  setRenderQuality: (quality: 'low' | 'medium' | 'high' | 'auto') => void;
  setGPUAcceleration: (enabled: boolean) => void;
  
  // ============================================================================
  // Actions - Recording
  // ============================================================================
  
  setMode: (mode: 'whiteboard' | 'presenter' | 'viewer') => void;
  setRecordInkInOutput: (enabled: boolean) => void;
  setBackground: (background: string | null) => void;
  startRecording: () => void;
  stopRecording: () => void;
  
  // ============================================================================
  // Actions - Tool-Specific
  // ============================================================================
  
  // Eraser
  setEraserMode: (mode: 'stroke' | 'area' | 'smart') => void;
  setEraserSize: (size: number) => void;
  
  // Text Formatting
  setFontFamily: (fontFamily: string) => void;
  setFontSize: (fontSize: number) => void;
  setFontWeight: (fontWeight: number) => void;
  setFontStyle: (fontStyle: 'normal' | 'italic') => void;
  setTextDecoration: (decoration: 'none' | 'underline' | 'line-through') => void;
  setTextAlign: (align: 'left' | 'center' | 'right' | 'justify') => void;
  setLineHeight: (lineHeight: number) => void;
  setLetterSpacing: (spacing: number) => void;
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleUnderline: () => void;
  
  // Emoji/Stamp
  addEmoji: (emoji: EmojiObject) => void;
  updateEmoji: (id: string, updates: Partial<EmojiObject>) => void;
  deleteEmoji: (id: string) => void;
  clearEmojis: () => void;
  setEmojiSize: (size: number) => void;
  
  // Laser
  updateLaserTrail: (point: { x: number; y: number }) => void;
  setLaserTrail: (trail: Array<{ x: number; y: number; timestamp: number }>) => void;
  clearLaserTrail: () => void;
  setLaserVisible: (visible: boolean) => void;
  setLaserColor: (color: string) => void;
  
  // ============================================================================
  // Actions - Utilities
  // ============================================================================
  
  reset: () => void;
  exportState: () => string;
  importState: (stateJson: string) => void;
  getVisibleShapes: () => WhiteboardShape[];
  getShapeAtPoint: (x: number, y: number) => WhiteboardShape | null;
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_VIEWPORT: ViewportTransformWithDPR = {
  panX: 0,
  panY: 0,
  zoom: 1,
  dpr: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
  canvasWidth: 1920,
  canvasHeight: 1080,
};

const DEFAULT_PERFORMANCE: PerformanceMetrics = {
  lastFrameTime: 0,
  fps: 60,
  shapeCount: 0,
  visibleShapeCount: 0,
  renderTime: 0,
  inputLatency: 0,
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useWhiteboardStore = create<WhiteboardStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // ============================================================================
        // Initial State
        // ============================================================================
        
        // Tool State
        tool: 'pen',
        color: '#000000',
        size: 3,
        opacity: 1,
        
        // Canvas State
        shapes: new Map(),
        emojis: new Map(),
        selectedShapeIds: new Set(),
        
        // History State
        history: [{ shapes: new Map(), timestamp: Date.now(), action: 'init' }],
        historyIndex: 0,
        maxHistorySize: 100,
        
        // Viewport State with DPR
        viewport: DEFAULT_VIEWPORT,
        
        // Collaboration State
        remoteCursors: new Map(),
        localCursorId: null,
        
        // Config
        config: DEFAULT_WHITEBOARD_CONFIG as WhiteboardConfig,
        
        // Performance State
        performance: DEFAULT_PERFORMANCE,
        pendingBatchUpdate: null,
        batchUpdateTimer: null,
        renderQuality: 'auto',
        enableGPUAcceleration: true,
        
        // Mode & Recording State
        mode: 'whiteboard',
        recordInkInOutput: false,
        background: null,
        isRecording: false,
        recordingStartTime: null,
        
        // Eraser State
        eraserMode: 'stroke',
        eraserSize: 20,
        
        // Text Formatting State
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 16,
        fontWeight: 400,
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'left',
        lineHeight: 1.5,
        letterSpacing: 0,
        
        // Emoji State
        emojiDebug: false,
        emojiSnapToGrid: false,
        emojiUseTwemoji: false,
        emojiSize: 32,
        
        // Laser State
        laserTrail: [],
        laserVisible: false,
        laserColor: '#FF0000',
        
        // ============================================================================
        // Tool Actions
        // ============================================================================
        
        setTool: (tool) => set((state) => {
          state.tool = tool;
          // Clear laser trail when switching away from laser
          if (tool !== 'laser') {
            state.laserTrail = [];
            state.laserVisible = false;
          }
        }),
        
        setColor: (color) => set((state) => {
          state.color = color;
        }),
        
        setSize: (size) => set((state) => {
          state.size = Math.max(1, Math.min(100, size));
        }),
        
        setOpacity: (opacity) => set((state) => {
          state.opacity = Math.max(0, Math.min(1, opacity));
        }),
        
        // ============================================================================
        // Shape Actions with Batching
        // ============================================================================
        
        addShape: (shape) => {
          set((state) => {
            state.shapes.set(shape.id, shape);
            state.performance.shapeCount = state.shapes.size;
          });
          get().saveHistory('add');
        },
        
        addShapes: (shapes) => {
          set((state) => {
            shapes.forEach(shape => {
              state.shapes.set(shape.id, shape);
            });
            state.performance.shapeCount = state.shapes.size;
          });
          get().saveHistory('add-multiple');
        },
        
        updateShape: (id, updates) => {
          set((state) => {
            const shape = state.shapes.get(id);
            if (shape) {
              // Type-safe update that preserves the shape type
              const updatedShape = { ...shape, ...updates, updatedAt: Date.now() } as WhiteboardShape;
              state.shapes.set(id, updatedShape);
            }
          });
        },
        
        updateShapes: (updates) => {
          set((state) => {
            updates.forEach((update, id) => {
              const shape = state.shapes.get(id);
              if (shape) {
                // Type-safe update that preserves the shape type
                const updatedShape = { ...shape, ...update, updatedAt: Date.now() } as WhiteboardShape;
                state.shapes.set(id, updatedShape);
              }
            });
          });
        },
        
        deleteShape: (id) => {
          set((state) => {
            state.shapes.delete(id);
            state.selectedShapeIds.delete(id);
            state.performance.shapeCount = state.shapes.size;
          });
          get().saveHistory('delete');
        },
        
        deleteShapes: (ids) => {
          set((state) => {
            ids.forEach(id => {
              state.shapes.delete(id);
              state.selectedShapeIds.delete(id);
            });
            state.performance.shapeCount = state.shapes.size;
          });
          get().saveHistory('delete-multiple');
        },
        
        clearShapes: () => {
          set((state) => {
            state.shapes.clear();
            state.selectedShapeIds.clear();
            state.performance.shapeCount = 0;
          });
          get().saveHistory('clear');
        },
        
        // Batch update for performance
        batchUpdate: (updates) => {
          const state = get();
          
          // Clear existing timer
          if (state.batchUpdateTimer) {
            clearTimeout(state.batchUpdateTimer);
          }
          
          // Merge with pending updates
          const pending = state.pendingBatchUpdate || { timestamp: Date.now() };
          const merged: BatchUpdate = {
            ...pending,
            ...updates,
            timestamp: Date.now(),
          };
          
          set((state) => {
            state.pendingBatchUpdate = merged;
            state.batchUpdateTimer = setTimeout(() => {
              get().flushBatchUpdate();
            }, 16); // Flush after one frame
          });
        },
        
        flushBatchUpdate: () => {
          const pending = get().pendingBatchUpdate;
          if (!pending) return;
          
          set((state) => {
            if (pending.shapes) state.shapes = pending.shapes;
            if (pending.emojis) state.emojis = pending.emojis;
            if (pending.selectedShapeIds) state.selectedShapeIds = pending.selectedShapeIds;
            
            state.pendingBatchUpdate = null;
            state.batchUpdateTimer = null;
          });
          
          get().saveHistory('batch-update');
        },
        
        // ============================================================================
        // Selection Actions
        // ============================================================================
        
        selectShape: (id) => {
          set((state) => {
            state.selectedShapeIds.add(id);
          });
        },
        
        selectShapes: (ids) => {
          set((state) => {
            ids.forEach(id => state.selectedShapeIds.add(id));
          });
        },
        
        deselectShape: (id) => {
          set((state) => {
            state.selectedShapeIds.delete(id);
          });
        },
        
        deselectShapes: (ids) => {
          set((state) => {
            ids.forEach(id => state.selectedShapeIds.delete(id));
          });
        },
        
        clearSelection: () => {
          set((state) => {
            state.selectedShapeIds.clear();
          });
        },
        
        selectAll: () => {
          set((state) => {
            state.shapes.forEach((_, id) => {
              state.selectedShapeIds.add(id);
            });
          });
        },
        
        // Compatibility method for external tools
        setSelectedShapeIds: (ids) => {
          set((state) => {
            state.selectedShapeIds = new Set(ids);
          });
        },
        
        // Text editing
        setEditingTextId: (id) => {
          set((state) => {
            // Store editing text ID in a new property or handle it
            // For now, we'll clear selection and select only the text shape
            if (id) {
              state.selectedShapeIds.clear();
              state.selectedShapeIds.add(id);
              // You may want to add an editingTextId property to the state
            }
          });
        },
        
        // ============================================================================
        // History Actions with Compression
        // ============================================================================
        
        undo: () => {
          const { history, historyIndex } = get();
          if (historyIndex <= 0) return;
          
          const newIndex = historyIndex - 1;
          const entry = history[newIndex];
          if (entry) {
            set((state) => {
              state.shapes = new Map(entry.shapes);
              state.historyIndex = newIndex;
            });
          }
        },
        
        redo: () => {
          const { history, historyIndex } = get();
          if (historyIndex >= history.length - 1) return;
          
          const newIndex = historyIndex + 1;
          const entry = history[newIndex];
          if (entry) {
            set((state) => {
              state.shapes = new Map(entry.shapes);
              state.historyIndex = newIndex;
            });
          }
        },
        
        saveHistory: (action, metadata) => {
          const { shapes, history, historyIndex, maxHistorySize } = get();
          
          set((state) => {
            // Truncate history if not at end
            const newHistory = history.slice(0, historyIndex + 1);
            
            // Add new entry
            newHistory.push({
              shapes: new Map(shapes),
              timestamp: Date.now(),
              action,
              data: metadata,
            });
            
            // Limit history size
            while (newHistory.length > maxHistorySize) {
              newHistory.shift();
            }
            
            state.history = newHistory;
            state.historyIndex = newHistory.length - 1;
          });
        },
        
        // Alias for saveHistory for compatibility
        pushHistory: (action, metadata) => {
          get().saveHistory(action, metadata);
        },
        
        compressHistory: () => {
          // Implement history compression to save memory
          // Keep every Nth state, remove intermediate states
          const { history } = get();
          const compressed: WhiteboardHistoryEntry[] = [];
          const keepInterval = 5; // Keep every 5th state
          
          history.forEach((entry, index) => {
            if (index === 0 || index === history.length - 1 || index % keepInterval === 0) {
              compressed.push(entry);
            }
          });
          
          set((state) => {
            state.history = compressed;
            state.historyIndex = compressed.length - 1;
          });
        },
        
        clearHistory: () => {
          set((state) => {
            state.history = [{ 
              shapes: new Map(state.shapes), 
              timestamp: Date.now(), 
              action: 'clear-history' 
            }];
            state.historyIndex = 0;
          });
        },
        
        // ============================================================================
        // Viewport Actions with DPR
        // ============================================================================
        
        setPan: (panX, panY) => {
          set((state) => {
            state.viewport.panX = panX;
            state.viewport.panY = panY;
          });
        },
        
        setZoom: (zoom, focalX, focalY) => {
          const { config, viewport } = get();
          const clampedZoom = Math.max(config.minZoom, Math.min(config.maxZoom, zoom));
          
          set((state) => {
            if (focalX !== undefined && focalY !== undefined) {
              // Zoom with focal point
              const scale = clampedZoom / viewport.zoom;
              state.viewport.panX = focalX - (focalX - viewport.panX) * scale;
              state.viewport.panY = focalY - (focalY - viewport.panY) * scale;
            }
            state.viewport.zoom = clampedZoom;
          });
        },
        
        resetViewport: () => {
          set((state) => {
            state.viewport = { ...DEFAULT_VIEWPORT, dpr: state.viewport.dpr };
          });
        },
        
        fitToContent: () => {
          const { shapes, viewport } = get();
          if (shapes.size === 0) return;
          
          // Calculate bounding box of all shapes
          let minX = Infinity, minY = Infinity;
          let maxX = -Infinity, maxY = -Infinity;
          
          shapes.forEach(shape => {
            // Get bounds based on shape type
            let bounds = { x: shape.x, y: shape.y, width: 100, height: 100 };
            
            if ('width' in shape && 'height' in shape) {
              bounds.width = shape.width as number;
              bounds.height = shape.height as number;
            } else if ('points' in shape && Array.isArray(shape.points)) {
              // For strokes, calculate bounds from points
              const points = shape.points as Array<{ x: number; y: number }>;
              if (points.length > 0) {
                let minPX = points[0].x, maxPX = points[0].x;
                let minPY = points[0].y, maxPY = points[0].y;
                points.forEach(p => {
                  minPX = Math.min(minPX, p.x);
                  maxPX = Math.max(maxPX, p.x);
                  minPY = Math.min(minPY, p.y);
                  maxPY = Math.max(maxPY, p.y);
                });
                bounds = { x: minPX, y: minPY, width: maxPX - minPX, height: maxPY - minPY };
              }
            }
            
            minX = Math.min(minX, bounds.x);
            minY = Math.min(minY, bounds.y);
            maxX = Math.max(maxX, bounds.x + bounds.width);
            maxY = Math.max(maxY, bounds.y + bounds.height);
          });
          
          // Calculate zoom to fit content
          const contentWidth = maxX - minX;
          const contentHeight = maxY - minY;
          const zoomX = viewport.canvasWidth / contentWidth;
          const zoomY = viewport.canvasHeight / contentHeight;
          const newZoom = Math.min(zoomX, zoomY) * 0.9; // 90% to add padding
          
          set((state) => {
            state.viewport.zoom = newZoom;
            state.viewport.panX = (minX + maxX) / 2;
            state.viewport.panY = (minY + maxY) / 2;
          });
        },
        
        updateDPR: (dpr) => {
          set((state) => {
            state.viewport.dpr = dpr;
          });
        },
        
        setCanvasSize: (width, height) => {
          set((state) => {
            state.viewport.canvasWidth = width;
            state.viewport.canvasHeight = height;
          });
        },
        
        updateViewport: (viewport) => {
          set((state) => {
            Object.assign(state.viewport, viewport);
          });
        },
        
        // ============================================================================
        // Collaboration Actions
        // ============================================================================
        
        updateRemoteCursor: (userId, cursor) => {
          set((state) => {
            state.remoteCursors.set(userId, cursor);
          });
        },
        
        removeRemoteCursor: (userId) => {
          set((state) => {
            state.remoteCursors.delete(userId);
          });
        },
        
        clearRemoteCursors: () => {
          set((state) => {
            state.remoteCursors.clear();
          });
        },
        
        setLocalCursorId: (id) => {
          set((state) => {
            state.localCursorId = id;
          });
        },
        
        // ============================================================================
        // Performance Actions
        // ============================================================================
        
        updatePerformanceMetrics: (metrics) => {
          set((state) => {
            state.performance = { ...state.performance, ...metrics };
          });
        },
        
        setRenderQuality: (quality) => {
          set((state) => {
            state.renderQuality = quality;
          });
        },
        
        setGPUAcceleration: (enabled) => {
          set((state) => {
            state.enableGPUAcceleration = enabled;
          });
        },
        
        // ============================================================================
        // Recording Actions
        // ============================================================================
        
        setMode: (mode) => set((state) => {
          state.mode = mode;
        }),
        
        setRecordInkInOutput: (enabled) => set((state) => {
          state.recordInkInOutput = enabled;
        }),
        
        setBackground: (background) => set((state) => {
          state.background = background;
        }),
        
        startRecording: () => set((state) => {
          state.isRecording = true;
          state.recordingStartTime = Date.now();
        }),
        
        stopRecording: () => set((state) => {
          state.isRecording = false;
          state.recordingStartTime = null;
        }),
        
        // ============================================================================
        // Tool-Specific Actions
        // ============================================================================
        
        // Eraser
        setEraserMode: (mode) => set((state) => {
          state.eraserMode = mode;
        }),
        
        setEraserSize: (size) => set((state) => {
          state.eraserSize = Math.max(5, Math.min(200, size));
        }),
        
        // Text Formatting
        setFontFamily: (fontFamily) => set((state) => {
          state.fontFamily = fontFamily;
        }),
        
        setFontSize: (fontSize) => set((state) => {
          state.fontSize = Math.max(8, Math.min(144, fontSize));
        }),
        
        setFontWeight: (fontWeight) => set((state) => {
          state.fontWeight = fontWeight;
        }),
        
        setFontStyle: (fontStyle) => set((state) => {
          state.fontStyle = fontStyle;
        }),
        
        setTextDecoration: (textDecoration) => set((state) => {
          state.textDecoration = textDecoration;
        }),
        
        setTextAlign: (textAlign) => set((state) => {
          state.textAlign = textAlign;
        }),
        
        setLineHeight: (lineHeight) => set((state) => {
          state.lineHeight = Math.max(0.5, Math.min(3, lineHeight));
        }),
        
        setLetterSpacing: (letterSpacing) => set((state) => {
          state.letterSpacing = Math.max(-5, Math.min(20, letterSpacing));
        }),
        
        toggleBold: () => set((state) => {
          state.fontWeight = state.fontWeight === 700 ? 400 : 700;
        }),
        
        toggleItalic: () => set((state) => {
          state.fontStyle = state.fontStyle === 'italic' ? 'normal' : 'italic';
        }),
        
        toggleUnderline: () => set((state) => {
          state.textDecoration = state.textDecoration === 'underline' ? 'none' : 'underline';
        }),
        
        // Emoji/Stamp
        addEmoji: (emoji) => {
          set((state) => {
            state.emojis.set(emoji.id, emoji);
          });
        },
        
        updateEmoji: (id, updates) => {
          set((state) => {
            const emoji = state.emojis.get(id);
            if (emoji) {
              state.emojis.set(id, { ...emoji, ...updates });
            }
          });
        },
        
        deleteEmoji: (id) => {
          set((state) => {
            state.emojis.delete(id);
          });
        },
        
        clearEmojis: () => {
          set((state) => {
            state.emojis.clear();
          });
        },
        
        setEmojiSize: (size) => {
          set((state) => {
            state.emojiSize = Math.max(16, Math.min(256, size));
          });
        },
        
        // Laser
        updateLaserTrail: (point) => {
          const now = Date.now();
          set((state) => {
            // Add new point
            state.laserTrail.push({ ...point, timestamp: now });
            
            // Remove old points (older than 500ms)
            state.laserTrail = state.laserTrail.filter(p => now - p.timestamp < 500);
          });
        },
        
        setLaserTrail: (trail) => {
          set((state) => {
            state.laserTrail = trail;
          });
        },
        
        clearLaserTrail: () => {
          set((state) => {
            state.laserTrail = [];
          });
        },
        
        setLaserVisible: (visible) => {
          set((state) => {
            state.laserVisible = visible;
          });
        },
        
        setLaserColor: (color) => {
          set((state) => {
            state.laserColor = color;
          });
        },
        
        // ============================================================================
        // Utility Actions
        // ============================================================================
        
        reset: () => {
          set((state) => {
            Object.assign(state, {
              tool: 'pen',
              color: '#000000',
              size: 3,
              opacity: 1,
              shapes: new Map(),
              emojis: new Map(),
              selectedShapeIds: new Set(),
              history: [{ shapes: new Map(), timestamp: Date.now(), action: 'reset' }],
              historyIndex: 0,
              viewport: { ...DEFAULT_VIEWPORT, dpr: state.viewport.dpr },
              remoteCursors: new Map(),
              performance: DEFAULT_PERFORMANCE,
            });
          });
        },
        
        exportState: () => {
          const state = get();
          return JSON.stringify({
            shapes: Array.from(state.shapes.entries()),
            emojis: Array.from(state.emojis.entries()),
            viewport: state.viewport,
            config: state.config,
          });
        },
        
        importState: (stateJson) => {
          try {
            const imported = JSON.parse(stateJson);
            set((state) => {
              if (imported.shapes) {
                state.shapes = new Map(imported.shapes);
              }
              if (imported.emojis) {
                state.emojis = new Map(imported.emojis);
              }
              if (imported.viewport) {
                state.viewport = { ...state.viewport, ...imported.viewport };
              }
              if (imported.config) {
                state.config = { ...state.config, ...imported.config };
              }
            });
            get().saveHistory('import');
          } catch (error) {
            console.error('[WhiteboardStore] Import failed:', error);
          }
        },
        
        getVisibleShapes: () => {
          const { shapes } = get();
          const visible: WhiteboardShape[] = [];
          
          // Simple visibility check (can be optimized with spatial indexing)
          shapes.forEach(shape => {
            // This is a simplified check - you should implement proper bounds checking
            const inView = true; // Replace with actual visibility check
            if (inView) {
              visible.push(shape);
            }
          });
          
          return visible;
        },
        
        getShapeAtPoint: (x, y) => {
          const { shapes } = get();
          
          // Iterate in reverse order (top shapes first)
          const shapesArray = Array.from(shapes.values()).reverse();
          
          for (const shape of shapesArray) {
            // Type-safe hit testing based on shape type
            let hit = false;
            
            if ('width' in shape && 'height' in shape) {
              // Rectangle-based shapes
              const width = shape.width as number;
              const height = shape.height as number;
              hit = x >= shape.x && x <= shape.x + width &&
                    y >= shape.y && y <= shape.y + height;
            } else if ('points' in shape && Array.isArray(shape.points)) {
              // For strokes, check if point is near any segment
              const points = shape.points as Array<{ x: number; y: number }>;
              const threshold = 10; // Hit threshold in pixels
              
              for (let i = 0; i < points.length - 1; i++) {
                const p1 = points[i];
                const p2 = points[i + 1];
                
                // Simple distance to line segment check
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const t = Math.max(0, Math.min(1, ((x - p1.x) * dx + (y - p1.y) * dy) / (dx * dx + dy * dy)));
                const nearestX = p1.x + t * dx;
                const nearestY = p1.y + t * dy;
                const distance = Math.sqrt((x - nearestX) ** 2 + (y - nearestY) ** 2);
                
                if (distance <= threshold) {
                  hit = true;
                  break;
                }
              }
            } else {
              // Default hit test for other shapes
              hit = Math.abs(x - shape.x) <= 50 && Math.abs(y - shape.y) <= 50;
            }
            
            if (hit) {
              return shape;
            }
          }
          
          return null;
        },
      }))
    ),
    {
      name: 'whiteboard-store',
    }
  )
);

// ============================================================================
// Performance Subscriptions
// ============================================================================

// Monitor shape count changes
useWhiteboardStore.subscribe(
  (state) => state.shapes.size,
  (size) => {
    useWhiteboardStore.getState().updatePerformanceMetrics({ shapeCount: size });
  }
);

// ============================================================================
// Dev/Test Exposure
// ============================================================================

declare global {
  interface Window {
    __WB_STORE__?: typeof useWhiteboardStore;
    __WB_DEBUG__?: boolean;
  }
}

if (typeof window !== 'undefined') {
  window.__WB_STORE__ = useWhiteboardStore;
  
  // Debug helpers
  if (process.env.NODE_ENV === 'development') {
    window.__WB_DEBUG__ = true;
    
    // Log state changes in development
    useWhiteboardStore.subscribe((state, prevState) => {
      if (window.__WB_DEBUG__) {
        console.log('[WhiteboardStore] State changed:', {
          tool: state.tool !== prevState.tool ? state.tool : undefined,
          shapeCount: state.shapes.size,
          viewport: state.viewport !== prevState.viewport ? state.viewport : undefined,
        });
      }
    });
  }
}

// ============================================================================
// Exports
// ============================================================================

export type { WhiteboardStore, ViewportTransformWithDPR, PerformanceMetrics };
