// ============================================================================
// TYPE DEFINITIONS - Microsoft L67+ Enterprise Grade
// ============================================================================
// Version: 2.0.0
// Last Updated: 2025-01-18
// ============================================================================

// ============================================================================
// Core Types
// ============================================================================

export interface WhiteboardPoint {
  x: number;
  y: number;
  pressure?: number; // Optional pressure for stylus input
  timestamp?: number; // Optional timestamp for velocity calculations
}

export interface ViewportState {
  x: number;
  y: number;
  scale: number;
  rotation?: number;
  dpr?: number; // Device pixel ratio at time of viewport capture
  zoom?: number; // Alias for scale (for compatibility)
  width?: number; // Canvas width
  height?: number; // Canvas height
  // Aliases for compatibility with ViewportTransform
  panX?: number; // Alias for x
  panY?: number; // Alias for y
}

export interface ViewportTransform {
  panX: number;
  panY: number;
  zoom: number;
  // Aliases for compatibility with ViewportState
  x?: number; // Alias for panX
  y?: number; // Alias for panY
  scale?: number; // Alias for zoom
  dpr?: number;
  width?: number;
  height?: number;
}

// ============================================================================
// Metadata Types
// ============================================================================

export interface StrokeMetadata {
  dpr: number;                    // Device pixel ratio when stroke was created
  deviceType: 'touch' | 'coarse' | 'fine';  // Input device classification
  pointerType: string;             // 'mouse' | 'pen' | 'touch' | etc.
  renderTime?: number;             // Average frame time during drawing
  simplificationRatio?: number;    // Point reduction percentage
  originalPointCount?: number;     // Points before simplification
  finalPointCount?: number;        // Points after simplification
  drawDuration?: number;           // Total time from start to end
  platform?: string;               // OS/Browser info
  inputLatency?: number;           // Average input latency
  avgVelocity?: number;            // Average drawing velocity
  maxVelocity?: number;            // Maximum drawing velocity
}

// ============================================================================
// Shape Base Types
// ============================================================================

export interface WhiteboardShapeBase {
  id: string;
  type: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  createdAt: number;
  updatedAt: number;
  metadata?: StrokeMetadata;  // Optional metadata for all shapes
}

// ============================================================================
// Gradient Types
// ============================================================================

export interface GradientStop {
  offset: number;
  color: string;
  opacity?: number;
  alpha?: number; // Alias for opacity
}

export interface WhiteboardGradient {
  type: 'linear' | 'radial';
  stops: GradientStop[];
  angle?: number;           // For linear gradients
  angleDeg?: number;        // Angle in degrees (alias)
  centerX?: number;          // For radial gradients
  centerY?: number;          // For radial gradients
  radius?: number;           // For radial gradients
}

// ============================================================================
// Annotation Types with Metadata Support
// ============================================================================

export interface HighlighterAnnotation extends WhiteboardShapeBase {
  type: 'highlighter';
  points: WhiteboardPoint[];
  colorGradient: WhiteboardGradient;
  thickness: number;
  composite: 'multiply' | 'normal' | 'overlay';
  smoothing?: number;        // Optional smoothing factor
  capStyle?: 'round' | 'square' | 'butt';
  joinStyle?: 'round' | 'miter' | 'bevel';
  // Compatibility properties
  color?: string;  // Fallback color from gradient
  size?: number;   // Alias for thickness
}

export interface PenAnnotation extends WhiteboardShapeBase {
  type: 'pen';
  points: WhiteboardPoint[];
  color: string;
  thickness: number;
  smoothing?: number;
  capStyle?: 'round' | 'square' | 'butt';
  joinStyle?: 'round' | 'miter' | 'bevel';
  // Compatibility properties
  size?: number;   // Alias for thickness
}

export interface EraserAnnotation extends WhiteboardShapeBase {
  type: 'eraser';
  points: WhiteboardPoint[];
  thickness: number;
}

// ============================================================================
// Shape Types Union
// ============================================================================

export type WhiteboardAnnotation = 
  | HighlighterAnnotation 
  | PenAnnotation 
  | EraserAnnotation;

export type WhiteboardShape = 
  | WhiteboardAnnotation
  | TextShape
  | ImageShape
  | EmojiObject
  | StampShape
  | ShapeObject;

// ============================================================================
// Other Shape Types
// ============================================================================

export interface TextShape extends WhiteboardShapeBase {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  width?: number;
  height?: number;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  lineHeight?: number;
  letterSpacing?: number;
  fontWeight?: 'normal' | 'bold' | number;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  points?: WhiteboardPoint[]; // For compatibility
  // Compatibility properties
  text?: string;  // Alias for content
}

export interface TextAnnotation extends TextShape {
  // Alias for compatibility
}

export interface EmojiObject extends WhiteboardShapeBase {
  type: 'emoji';
  emoji: string;
  size: number;
  native?: boolean;
  zIndex?: number; // Z-index for layering
  glyph?: string; // Alternative emoji representation
  points?: WhiteboardPoint[]; // For compatibility
}

// Alias for compatibility
export interface EmojiAnnotation extends EmojiObject {}

export interface StampShape extends WhiteboardShapeBase {
  type: 'stamp';
  stampEmoji: string;
  size: number;
  points?: WhiteboardPoint[];
}

export interface ImageShape extends WhiteboardShapeBase {
  type: 'image';
  url: string;
  width: number;
  height: number;
  naturalWidth?: number;
  naturalHeight?: number;
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  clipPath?: string;
}

export interface ShapeObject extends WhiteboardShapeBase {
  type: 'rectangle' | 'circle' | 'triangle' | 'arrow' | 'line';
  width?: number;
  height?: number;
  radius?: number;
  points?: WhiteboardPoint[];
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  // Compatibility properties
  color?: string;      // Alias for stroke
  size?: number;       // Alias for strokeWidth
  fillColor?: string;  // Alias for fill
}

// ============================================================================
// Store Types
// ============================================================================

export interface WhiteboardStore {
  // Canvas state
  shapes: Map<string, WhiteboardShape>;
  viewport: ViewportState;
  
  // Tool state
  activeTool: ToolType;
  color: string;
  size: number;
  opacity: number;
  
  // History
  history: HistoryEntry[];
  historyIndex: number;
  
  // Methods
  saveHistory: (action: string) => void;
  pushHistory: (action: string) => void; // Alias for saveHistory
  undo: () => void;
  redo: () => void;
  
  // Selection
  selectedShapeIds: Set<string>;
  
  // Performance
  renderQuality: 'low' | 'medium' | 'high' | 'auto';
  enableGPU: boolean;
  
  // Collaboration (optional)
  collaborators?: Map<string, Collaborator>;
  cursorPositions?: Map<string, CursorPosition>;
}

// ============================================================================
// Tool Types
// ============================================================================

export type WhiteboardTool = 
  | 'select'
  | 'hand'
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'text'
  | 'shape'
  | 'image'
  | 'stamp'
  | 'pan'
  | 'zoom'
  | 'laser'
  | 'emoji'
  | 'rectangle'
  | 'circle'
  | 'arrow'
  | 'line';

export type ToolType = WhiteboardTool; // Alias for backward compatibility

export interface ToolState {
  type: ToolType;
  isActive: boolean;
  options: Record<string, any>;
}

// ============================================================================
// History Types
// ============================================================================

export interface WhiteboardHistoryEntry {
  shapes: Map<string, WhiteboardShape>;
  timestamp: number;
  action: string;
  data?: any;
}

export interface HistoryEntry {
  id: string;
  action: string;
  timestamp: number;
  shapes: Map<string, WhiteboardShape>;
  viewport: ViewportState;
  data?: any; // Additional data for the history entry
  snapshot?: any; // Snapshot data for the history entry
  metadata?: {
    userId?: string;
    deviceId?: string;
    sessionId?: string;
  };
}

// ============================================================================
// Export Types
// ============================================================================

export interface ExportOptions {
  format: 'png' | 'jpg' | 'jpeg' | 'webp' | 'svg' | 'pdf';
  quality?: number;
  scale?: number;
  background?: string;
  includeMetadata?: boolean;
  dpi?: number;
}

// ============================================================================
// Collaboration Types (Optional)
// ============================================================================

export interface RemoteCursor {
  x: number;
  y: number;
  userId: string;
  userName?: string;
  color: string;
  timestamp: number;
  tool?: WhiteboardTool;
  position?: { x: number; y: number }; // Alternative position format for compatibility
}

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  cursor?: CursorPosition;
  lastSeen: number;
  isActive: boolean;
}

export interface CursorPosition {
  x: number;
  y: number;
  tool: ToolType;
  timestamp: number;
}

// ============================================================================
// Performance Types
// ============================================================================

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  drawCalls: number;
  shapeCount: number;
  pointCount: number;
  memoryUsage?: number;
  gpuUsage?: number;
}

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  viewport: ViewportState;
  dpr: number;
  quality: 'low' | 'medium' | 'high';
  debug?: boolean;
}

// ============================================================================
// Event Types
// ============================================================================

export interface WhiteboardEvent {
  type: string;
  timestamp: number;
  data: any;
  payload?: any; // Event payload for collaboration
  userId?: string; // User who triggered the event
  roomId?: string; // Room where event occurred
}

export interface PointerEventData {
  x: number;
  y: number;
  pressure: number;
  tiltX: number;
  tiltY: number;
  twist: number;
  pointerType: string;
  isPrimary: boolean;
  buttons: number;
}

// ============================================================================
// Export Types for Testing
// ============================================================================

export interface TestingExports {
  toolState: any;
  metrics: any;
  [key: string]: any;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface WhiteboardConfig {
  minZoom: number;
  maxZoom: number;
  enableTouch: boolean;
  enablePen: boolean;
  enableMouse: boolean;
  enableKeyboard: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
  maxShapes: number;
  maxHistorySize: number;
  enableCollaboration: boolean;
  enableGPU: boolean;
  renderQuality: 'low' | 'medium' | 'high' | 'auto';
}

export const DEFAULT_WHITEBOARD_CONFIG: WhiteboardConfig = {
  minZoom: 0.1,
  maxZoom: 10,
  enableTouch: true,
  enablePen: true,
  enableMouse: true,
  enableKeyboard: true,
  autoSave: false,
  autoSaveInterval: 30000, // 30 seconds
  maxShapes: 10000,
  maxHistorySize: 100,
  enableCollaboration: false,
  enableGPU: true,
  renderQuality: 'auto',
};

// ============================================================================
// Constants
// ============================================================================

export const EMOJI_FONT_STACK = `"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji","EmojiOne Color","Twitter Color Emoji", "Twemoji Mozilla",system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

// ============================================================================
// Text Tool Constants
// ============================================================================

export const TEXT_FONT_FAMILIES = [
  { value: 'Arial, sans-serif', name: 'Arial' },
  { value: 'Helvetica, sans-serif', name: 'Helvetica' },
  { value: 'Georgia, serif', name: 'Georgia' },
  { value: 'Times New Roman, serif', name: 'Times' },
  { value: 'Courier New, monospace', name: 'Courier' },
  { value: 'Monaco, monospace', name: 'Monaco' },
  { value: 'Comic Sans MS, cursive', name: 'Comic Sans' },
];

export const TEXT_FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72];

export const TEXT_FONT_WEIGHTS = [
  { value: 100, name: 'Thin' },
  { value: 300, name: 'Light' },
  { value: 400, name: 'Regular' },
  { value: 500, name: 'Medium' },
  { value: 600, name: 'Semibold' },
  { value: 700, name: 'Bold' },
  { value: 900, name: 'Black' },
];

// ============================================================================
// Additional Type Aliases for Compatibility
// ============================================================================

export type LinearGradient = WhiteboardGradient;
export type CompositeMode = 'multiply' | 'normal' | 'overlay' | 'source-over' | 'source-atop';

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

// ============================================================================
// Type Guard Functions
// ============================================================================

/**
 * Type guard to check if a shape has points property
 */
export function hasPoints(
  shape: WhiteboardShape
): shape is PenAnnotation | HighlighterAnnotation | EraserAnnotation | ShapeObject {
  return 'points' in shape && Array.isArray((shape as any).points);
}

/**
 * Type guard to check if a shape is a highlighter annotation
 */
export function isHighlighterAnnotation(
  shape: WhiteboardShape
): shape is HighlighterAnnotation {
  return shape.type === 'highlighter';
}

/**
 * Type guard to check if a shape has gradient property
 */
export function hasGradient(
  shape: WhiteboardShape
): shape is HighlighterAnnotation {
  return isHighlighterAnnotation(shape);
}

/**
 * Type guard to check if a shape has composite property
 */
export function hasComposite(
  shape: WhiteboardShape
): shape is HighlighterAnnotation {
  return isHighlighterAnnotation(shape);
}

/**
 * Type guard to check if a shape is a text shape
 */
export function isTextShape(shape: WhiteboardShape): shape is TextShape {
  return shape.type === 'text';
}

/**
 * Type guard to check if a shape is an emoji object
 */
export function isEmojiObject(shape: WhiteboardShape): shape is EmojiObject {
  return shape.type === 'emoji';
}

/**
 * Type guard to check if a shape is an image shape
 */
export function isImageShape(shape: WhiteboardShape): shape is ImageShape {
  return shape.type === 'image';
}
