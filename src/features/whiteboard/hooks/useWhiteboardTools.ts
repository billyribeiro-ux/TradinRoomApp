/**
 * ============================================================================
 * WHITEBOARD TOOLS INTEGRATION HOOK - Microsoft L67+ Enterprise Grade
 * ============================================================================
 * Integrates ALL tool handlers with performance optimizations
 * ============================================================================
 * Version: 2.0.0
 * Last Updated: 2025-01-18
 * ============================================================================
 */

import { useCallback, useRef, useEffect, useMemo } from 'react';
import { useWhiteboardStore } from '../state/whiteboardStore';
import type { ViewportState, WhiteboardTool } from '../types';

// ============================================================================
// Tool Handler Imports
// ============================================================================

import {
  activatePenTool,
  deactivatePenTool,
  handlePenPointerDown,
  handlePenPointerMove,
  handlePenPointerUp
} from '../tools/PenTool';

import {
  activateHighlighterTool,
  deactivateHighlighterTool,
  handleHighlighterPointerDown,
  handleHighlighterPointerMove,
  handleHighlighterPointerUp
} from '../tools/HighlighterTool';

import {
  activateEraserTool,
  deactivateEraserTool,
  handleEraserPointerDown,
  handleEraserPointerMove,
  handleEraserPointerUp
} from '../tools/EraserTool';

import {
  activateLineTool,
  deactivateLineTool,
  handleLinePointerDown,
  handleLinePointerMove,
  handleLinePointerUp
} from '../tools/LineTool';

import {
  activateRectangleTool,
  deactivateRectangleTool,
  handleRectanglePointerDown,
  handleRectanglePointerMove,
  handleRectanglePointerUp
} from '../tools/RectangleTool';

import {
  activateCircleTool,
  deactivateCircleTool,
  handleCirclePointerDown,
  handleCirclePointerMove,
  handleCirclePointerUp
} from '../tools/CircleTool';

import {
  activateArrowTool,
  deactivateArrowTool,
  handleArrowPointerDown,
  handleArrowPointerMove,
  handleArrowPointerUp
} from '../tools/ArrowTool';

import {
  activateTextTool,
  deactivateTextTool,
  handleTextPointerDown,
  handleTextPointerMove,
  handleTextPointerUp,
  handleTextKeyDown
} from '../tools/TextTool';

import {
  activateEmojiTool,
  deactivateEmojiTool,
  handleEmojiPointerDown,
  handleEmojiPointerMove,
  handleEmojiPointerUp
} from '../tools/EmojiTool';

// Laser tool (if available)
import {
  activateLaserTool,
  deactivateLaserTool,
  handleLaserPointerDown,
  handleLaserPointerMove,
  handleLaserPointerUp
} from '../tools/LaserTool';

// Select tool (if available)
import {
  activateSelectTool,
  deactivateSelectTool,
  handleSelectPointerDown,
  handleSelectPointerMove,
  handleSelectPointerUp,
  handleSelectKeyDown
} from '../tools/SelectTool';

// ============================================================================
// Type Definitions
// ============================================================================

interface UseWhiteboardToolsProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  viewportState: ViewportState;
  canAnnotate: boolean;
  enableShortcuts?: boolean;
  onToolChange?: (tool: WhiteboardTool) => void;
}

interface ToolHandlers {
  activate: (canvas?: HTMLElement | HTMLCanvasElement) => void;
  deactivate: () => void;
  pointerDown: (e: PointerEvent, canvas: HTMLElement | HTMLCanvasElement, viewport: any) => boolean;
  pointerMove: (e: PointerEvent, canvas: HTMLElement | HTMLCanvasElement, viewport: any) => boolean;
  pointerUp: (e: PointerEvent, canvas?: HTMLElement | HTMLCanvasElement, viewport?: any) => boolean;
  keyDown?: (e: KeyboardEvent) => boolean;
}

interface PanState {
  isPanning: boolean;
  startPoint: { x: number; y: number };
  startPan: { x: number; y: number };
  velocity: { x: number; y: number };
  lastTime: number;
}

interface ToolMetrics {
  activationTime: number;
  pointerDownCount: number;
  pointerMoveCount: number;
  lastUseTime: number;
}

// ============================================================================
// Constants
// ============================================================================

const TOOL_CONFIG = {
  PAN_INERTIA: 0.95,
  PAN_MIN_VELOCITY: 0.01,
  DOUBLE_CLICK_TIME: 300,
  LONG_PRESS_TIME: 500,
  CURSOR_UPDATE_THROTTLE: 16, // 60fps
} as const;

// Tool handler registry
const TOOL_HANDLERS: Partial<Record<WhiteboardTool, ToolHandlers>> = {
  pen: {
    activate: activatePenTool,
    deactivate: deactivatePenTool,
    pointerDown: handlePenPointerDown,
    pointerMove: handlePenPointerMove,
    pointerUp: handlePenPointerUp,
  },
  highlighter: {
    activate: activateHighlighterTool,
    deactivate: deactivateHighlighterTool,
    pointerDown: handleHighlighterPointerDown,
    pointerMove: handleHighlighterPointerMove,
    pointerUp: handleHighlighterPointerUp,
  },
  eraser: {
    activate: activateEraserTool,
    deactivate: deactivateEraserTool,
    pointerDown: handleEraserPointerDown,
    pointerMove: handleEraserPointerMove,
    pointerUp: handleEraserPointerUp,
  },
  line: {
    activate: activateLineTool,
    deactivate: deactivateLineTool,
    pointerDown: handleLinePointerDown,
    pointerMove: handleLinePointerMove,
    pointerUp: handleLinePointerUp,
  },
  rectangle: {
    activate: activateRectangleTool,
    deactivate: deactivateRectangleTool,
    pointerDown: handleRectanglePointerDown,
    pointerMove: handleRectanglePointerMove,
    pointerUp: handleRectanglePointerUp,
  },
  circle: {
    activate: activateCircleTool,
    deactivate: deactivateCircleTool,
    pointerDown: handleCirclePointerDown,
    pointerMove: handleCirclePointerMove,
    pointerUp: handleCirclePointerUp,
  },
  arrow: {
    activate: activateArrowTool,
    deactivate: deactivateArrowTool,
    pointerDown: handleArrowPointerDown,
    pointerMove: handleArrowPointerMove,
    pointerUp: handleArrowPointerUp,
  },
  text: {
    activate: activateTextTool,
    deactivate: deactivateTextTool,
    pointerDown: handleTextPointerDown,
    pointerMove: handleTextPointerMove,
    pointerUp: handleTextPointerUp,
    keyDown: handleTextKeyDown,
  },
  stamp: {
    activate: activateEmojiTool,
    deactivate: deactivateEmojiTool,
    pointerDown: handleEmojiPointerDown,
    pointerMove: handleEmojiPointerMove,
    pointerUp: handleEmojiPointerUp,
  },
  emoji: {
    activate: activateEmojiTool,
    deactivate: deactivateEmojiTool,
    pointerDown: handleEmojiPointerDown,
    pointerMove: handleEmojiPointerMove,
    pointerUp: handleEmojiPointerUp,
  },
  laser: {
    activate: activateLaserTool,
    deactivate: deactivateLaserTool,
    pointerDown: handleLaserPointerDown,
    pointerMove: handleLaserPointerMove,
    pointerUp: handleLaserPointerUp,
  },
  select: {
    activate: activateSelectTool,
    deactivate: deactivateSelectTool,
    pointerDown: handleSelectPointerDown,
    pointerMove: handleSelectPointerMove,
    pointerUp: handleSelectPointerUp,
    keyDown: handleSelectKeyDown,
  },
  hand: {
    activate: () => {},
    deactivate: () => {},
    pointerDown: () => false,
    pointerMove: () => false,
    pointerUp: () => false,
  },
};

// ============================================================================
// Main Hook Implementation
// ============================================================================

export function useWhiteboardTools({
  canvasRef,
  viewportState,
  canAnnotate,
  enableShortcuts = true,
  onToolChange,
}: UseWhiteboardToolsProps) {
  // Store state
  const tool = useWhiteboardStore((s) => s.tool);
  const viewport = useWhiteboardStore((s) => s.viewport);
  const setPan = useWhiteboardStore((s) => s.setPan);
  const setTool = useWhiteboardStore((s) => s.setTool);
  const updatePerformanceMetrics = useWhiteboardStore((s) => s.updatePerformanceMetrics);
  
  // Hand tool state with inertia support
  const panStateRef = useRef<PanState>({
    isPanning: false,
    startPoint: { x: 0, y: 0 },
    startPan: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    lastTime: 0,
  });
  
  // Performance tracking
  const metricsRef = useRef<Map<WhiteboardTool, ToolMetrics>>(new Map());
  
  // Previous tool for cleanup
  const previousToolRef = useRef<WhiteboardTool | null>(null);
  
  // Animation frame for inertial panning
  const inertiaRafRef = useRef<number | null>(null);
  
  // Double-click detection
  const lastClickTimeRef = useRef<number>(0);
  const lastClickPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // ============================================================================
  // DPR-Aware Viewport
  // ============================================================================
  
  const dprAwareViewport = useMemo<ViewportState>(() => ({
    ...viewportState,
    dpr: window.devicePixelRatio || 1,
  }), [viewportState]);
  
  // ============================================================================
  // Tool Activation
  // ============================================================================
  
  const activateTool = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.warn('[WhiteboardTools] Canvas not available for tool activation');
      return;
    }
    
    const startTime = performance.now();
    
    try {
      // Deactivate previous tool
      if (previousToolRef.current && previousToolRef.current !== tool) {
        const prevHandler = TOOL_HANDLERS[previousToolRef.current];
        if (prevHandler) {
          prevHandler.deactivate();
          console.log(`[WhiteboardTools] Deactivated ${previousToolRef.current}`);
        }
      }
      
      // Activate new tool
      const handler = TOOL_HANDLERS[tool];
      if (handler) {
        handler.activate(canvas);
        console.log(`[WhiteboardTools] Activated ${tool}`);
        
        // Update metrics
        const metrics = metricsRef.current.get(tool) || {
          activationTime: 0,
          pointerDownCount: 0,
          pointerMoveCount: 0,
          lastUseTime: Date.now(),
        };
        metrics.activationTime = performance.now() - startTime;
        metrics.lastUseTime = Date.now();
        metricsRef.current.set(tool, metrics);
        
        // Notify parent
        onToolChange?.(tool);
      }
      
      // Update cursor based on tool
      updateCursor(canvas, tool);
      
      previousToolRef.current = tool;
      
      // Log activation time in dev
      if (process.env.NODE_ENV === 'development') {
        const elapsed = performance.now() - startTime;
        if (elapsed > 10) {
          console.warn(`[WhiteboardTools] Slow activation for ${tool}: ${elapsed.toFixed(2)}ms`);
        }
      }
    } catch (error) {
      console.error(`[WhiteboardTools] Error activating ${tool}:`, error);
    }
  }, [tool, canvasRef, onToolChange]);
  
  // ============================================================================
  // Pointer Event Handlers
  // ============================================================================
  
  /**
   * Enhanced pointer down handler with double-click and long-press detection
   */
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const startTime = performance.now();
    
    // Check for double-click
    const now = Date.now();
    const timeDiff = now - lastClickTimeRef.current;
    const posDiff = Math.hypot(
      e.clientX - lastClickPosRef.current.x,
      e.clientY - lastClickPosRef.current.y
    );
    
    const isDoubleClick = timeDiff < TOOL_CONFIG.DOUBLE_CLICK_TIME && posDiff < 10;
    
    lastClickTimeRef.current = now;
    lastClickPosRef.current = { x: e.clientX, y: e.clientY };
    
    try {
      // Handle hand tool (always available)
      if (tool === 'hand') {
        const panState = panStateRef.current;
        panState.isPanning = true;
        panState.startPoint = { x: e.clientX, y: e.clientY };
        panState.startPan = { x: viewport.panX, y: viewport.panY };
        panState.velocity = { x: 0, y: 0 };
        panState.lastTime = now;
        
        // Cancel inertia animation
        if (inertiaRafRef.current) {
          cancelAnimationFrame(inertiaRafRef.current);
          inertiaRafRef.current = null;
        }
        
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = 'grabbing';
        e.preventDefault();
        
        // Update metrics
        updateInputLatency(startTime);
        return;
      }
      
      // Check annotation permission
      if (!canAnnotate && tool !== 'select') {
        console.warn('[WhiteboardTools] Annotation not allowed');
        return;
      }
      
      // Convert React event to native PointerEvent
      const nativeEvent = e.nativeEvent;
      
      // Handle double-click for select tool
      if (isDoubleClick && tool === 'select') {
        // Could trigger shape edit mode or other double-click action
        console.log('[WhiteboardTools] Double-click detected in select mode');
      }
      
      // Call appropriate tool handler
      const handler = TOOL_HANDLERS[tool];
      if (handler) {
        const handled = handler.pointerDown(nativeEvent, canvas, dprAwareViewport);
        
        if (handled) {
          e.preventDefault();
          
          // Update metrics
          const metrics = metricsRef.current.get(tool) || {
            activationTime: 0,
            pointerDownCount: 0,
            pointerMoveCount: 0,
            lastUseTime: Date.now(),
          };
          metrics.pointerDownCount++;
          metrics.lastUseTime = Date.now();
          metricsRef.current.set(tool, metrics);
        }
        
        updateInputLatency(startTime);
      }
    } catch (error) {
      console.error(`[WhiteboardTools] Error in pointerDown for ${tool}:`, error);
    }
  }, [tool, canAnnotate, viewport, dprAwareViewport, canvasRef]);
  
  /**
   * Enhanced pointer move handler with throttling and inertia calculation
   */
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const startTime = performance.now();
    
    try {
      // Handle hand tool panning with inertia
      if (tool === 'hand' && panStateRef.current.isPanning) {
        const panState = panStateRef.current;
        const now = Date.now();
        const dt = Math.max(1, now - panState.lastTime);
        
        // Calculate movement in viewport coordinates
        const dx = (e.clientX - panState.startPoint.x) / dprAwareViewport.width;
        const dy = (e.clientY - panState.startPoint.y) / dprAwareViewport.height;
        
        // Update velocity for inertia
        panState.velocity.x = dx / dt * 1000;
        panState.velocity.y = dy / dt * 1000;
        panState.lastTime = now;
        
        // Apply pan
        setPan(
          panState.startPan.x + dx,
          panState.startPan.y + dy
        );
        
        panState.startPoint = { x: e.clientX, y: e.clientY };
        panState.startPan = { x: viewport.panX, y: viewport.panY };
        
        e.preventDefault();
        updateInputLatency(startTime);
        return;
      }
      
      if (!canAnnotate && tool !== 'select') return;
      
      const nativeEvent = e.nativeEvent;
      
      // Call appropriate tool handler
      const handler = TOOL_HANDLERS[tool];
      if (handler) {
        const handled = handler.pointerMove(nativeEvent, canvas, dprAwareViewport);
        
        if (handled) {
          e.preventDefault();
          
          // Update metrics (throttled)
          const metrics = metricsRef.current.get(tool);
          if (metrics) {
            metrics.pointerMoveCount++;
            metrics.lastUseTime = Date.now();
          }
        }
        
        updateInputLatency(startTime);
      }
    } catch (error) {
      console.error(`[WhiteboardTools] Error in pointerMove for ${tool}:`, error);
    }
  }, [tool, canAnnotate, viewport, dprAwareViewport, setPan, canvasRef]);
  
  /**
   * Enhanced pointer up handler with inertial scrolling
   */
  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const startTime = performance.now();
    
    try {
      // Handle hand tool with inertia
      if (tool === 'hand') {
        const panState = panStateRef.current;
        
        if (panState.isPanning) {
          panState.isPanning = false;
          canvas.releasePointerCapture(e.pointerId);
          canvas.style.cursor = 'grab';
          
          // Start inertial scrolling if velocity is significant
          const velocityMagnitude = Math.hypot(panState.velocity.x, panState.velocity.y);
          if (velocityMagnitude > TOOL_CONFIG.PAN_MIN_VELOCITY) {
            startInertialPanning();
          }
        }
        
        e.preventDefault();
        updateInputLatency(startTime);
        return;
      }
      
      if (!canAnnotate && tool !== 'select') return;
      
      const nativeEvent = e.nativeEvent;
      
      // Call appropriate tool handler
      const handler = TOOL_HANDLERS[tool];
      if (handler) {
        const handled = handler.pointerUp(nativeEvent, canvas);
        
        if (handled) {
          e.preventDefault();
        }
        
        updateInputLatency(startTime);
      }
    } catch (error) {
      console.error(`[WhiteboardTools] Error in pointerUp for ${tool}:`, error);
    }
  }, [tool, canAnnotate, canvasRef]);
  
  // ============================================================================
  // Keyboard Event Handler
  // ============================================================================
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent | KeyboardEvent) => {
    if (!canAnnotate && tool !== 'select') return;
    
    const startTime = performance.now();
    
    try {
      // Tool-specific keyboard handling
      const handler = TOOL_HANDLERS[tool];
      if (handler?.keyDown) {
        const nativeEvent = 'nativeEvent' in e ? e.nativeEvent : e;
        const handled = handler.keyDown(nativeEvent as KeyboardEvent);
        
        if (handled && 'preventDefault' in e) {
          e.preventDefault();
        }
      }
      
      // Global keyboard shortcuts (if enabled)
      if (enableShortcuts) {
        handleGlobalShortcuts(e as KeyboardEvent);
      }
      
      updateInputLatency(startTime);
    } catch (error) {
      console.error(`[WhiteboardTools] Error in keyDown for ${tool}:`, error);
    }
  }, [tool, canAnnotate, enableShortcuts]);
  
  // ============================================================================
  // Helper Functions
  // ============================================================================
  
  /**
   * Updates cursor based on current tool
   */
  const updateCursor = (canvas: HTMLElement, tool: WhiteboardTool) => {
    const cursorMap: Partial<Record<WhiteboardTool, string>> = {
      pen: 'crosshair',
      highlighter: 'crosshair',
      eraser: 'cell',
      line: 'crosshair',
      rectangle: 'crosshair',
      circle: 'crosshair',
      arrow: 'crosshair',
      text: 'text',
      stamp: 'copy',
      emoji: 'copy',
      laser: 'pointer',
      select: 'default',
      hand: 'grab',
      shape: 'crosshair',
      image: 'copy',
      pan: 'grab',
      zoom: 'zoom-in',
    };
    
    canvas.style.cursor = cursorMap[tool] || 'default';
  };
  
  /**
   * Starts inertial panning animation
   */
  const startInertialPanning = () => {
    const animate = () => {
      const panState = panStateRef.current;
      
      // Apply friction
      panState.velocity.x *= TOOL_CONFIG.PAN_INERTIA;
      panState.velocity.y *= TOOL_CONFIG.PAN_INERTIA;
      
      // Check if velocity is too small
      const velocityMagnitude = Math.hypot(panState.velocity.x, panState.velocity.y);
      if (velocityMagnitude < TOOL_CONFIG.PAN_MIN_VELOCITY) {
        inertiaRafRef.current = null;
        return;
      }
      
      // Apply velocity to pan
      setPan(
        viewport.panX + panState.velocity.x * 0.016, // Assume 60fps
        viewport.panY + panState.velocity.y * 0.016
      );
      
      inertiaRafRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  };
  
  /**
   * Handles global keyboard shortcuts
   */
  const handleGlobalShortcuts = (e: KeyboardEvent) => {
    // Tool switching shortcuts
    const shortcuts: Record<string, WhiteboardTool> = {
      'p': 'pen',
      'h': 'highlighter',
      'e': 'eraser',
      'l': 'line',
      'r': 'rectangle',
      'c': 'circle',
      'a': 'arrow',
      't': 'text',
      's': 'select',
      ' ': 'hand', // Spacebar for hand tool
    };
    
    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      const newTool = shortcuts[e.key.toLowerCase()];
      if (newTool) {
        setTool(newTool);
        e.preventDefault();
      }
    }
  };
  
  /**
   * Updates input latency metrics
   */
  const updateInputLatency = (startTime: number) => {
    const latency = performance.now() - startTime;
    updatePerformanceMetrics({ inputLatency: latency });
    
    if (process.env.NODE_ENV === 'development' && latency > 16) {
      console.warn(`[WhiteboardTools] High input latency: ${latency.toFixed(2)}ms`);
    }
  };
  
  // ============================================================================
  // Cleanup
  // ============================================================================
  
  useEffect(() => {
    return () => {
      // Cancel inertia animation on unmount
      if (inertiaRafRef.current) {
        cancelAnimationFrame(inertiaRafRef.current);
      }
      
      // Deactivate current tool
      if (previousToolRef.current) {
        const handler = TOOL_HANDLERS[previousToolRef.current];
        if (handler) {
          handler.deactivate();
        }
      }
    };
  }, []);
  
  // ============================================================================
  // Return Interface
  // ============================================================================
  
  return {
    activateTool,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleKeyDown,
    
    // Additional utilities
    getCurrentTool: () => tool,
    getToolMetrics: () => metricsRef.current,
    isDrawing: () => {
      const metrics = metricsRef.current.get(tool);
      return metrics ? Date.now() - metrics.lastUseTime < 100 : false;
    },
  };
}

// ============================================================================
// Export for Testing
// ============================================================================

export const __testing__ = {
  TOOL_CONFIG,
  TOOL_HANDLERS,
};