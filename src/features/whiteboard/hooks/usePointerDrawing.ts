// ============================================================================
// POINTER DRAWING HOOK - Freehand Pen + Highlighter (SSOT, world-space)
// ============================================================================
// • Handles ONLY: pen + highlighter.
// • Mouse/touch/stylus pointer math in CSS px via getBoundingClientRect.
// • screenToWorld always receives a ViewportState with CSS width/height.
// • WhiteboardCanvas applies DPR + viewport → we draw in WORLD coordinates.
// • Zoom-like behavior: drawing only while primary button is held.
// ============================================================================

import { useCallback, useRef } from 'react';
import type { WhiteboardPoint, WhiteboardShape, ViewportState } from '../types';
import { useWhiteboardStore } from '../state/whiteboardStore';
import { screenToWorld } from '../utils/transform';
import { createDefaultHighlighterGradient } from '../utils/gradientBuilder';

export function usePointerDrawing(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  canAnnotate: boolean
) {
  const isDrawing = useRef(false);
  const currentShapeId = useRef<string | null>(null);
  const transactionId = useRef<string | null>(null);

  const tool = useWhiteboardStore((s) => s.tool);
  const color = useWhiteboardStore((s) => s.color);
  const size = useWhiteboardStore((s) => s.size);
  const opacity = useWhiteboardStore((s) => s.opacity);
  const viewportTransform = useWhiteboardStore((s) => s.viewport);
  const addShape = useWhiteboardStore((s) => s.addShape);
  const updateShape = useWhiteboardStore((s) => s.updateShape);

  // Convert PointerEvent → WORLD coordinates using CSS px + ViewportState
  const getPointerWorld = useCallback(
    (e: PointerEvent): WhiteboardPoint | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      // Apply DPR scaling for high-DPI displays
      // Canvas.width/rect.width gives us the actual DPR scale
      const sx = (e.clientX - rect.left) * (canvas.width / rect.width);
      const sy = (e.clientY - rect.top) * (canvas.height / rect.height);

      const viewportState: ViewportState = {
        x: viewportTransform.panX,
        y: viewportTransform.panY,
        scale: viewportTransform.zoom,
        dpr: viewportTransform.dpr,
        width: rect.width,
        height: rect.height,
      };

      return screenToWorld(sx, sy, viewportState);
    },
    [canvasRef, viewportTransform]
  );

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      if (!canAnnotate) return;
      // Only handle pen + highlighter here. All other tools have dedicated modules.
      if (tool !== 'pen' && tool !== 'highlighter') return;
      if (e.button !== 0) return; // primary button only

      const canvas = canvasRef.current;
      if (!canvas) return;

      e.preventDefault();

      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // non-fatal
      }

      const worldPoint = getPointerWorld(e);
      if (!worldPoint) return;

      isDrawing.current = true;
      transactionId.current = `tx-${Date.now()}`;
      currentShapeId.current = `shape-${Date.now()}-${Math.random()}`;

      const now = Date.now();

      const newShape: WhiteboardShape = tool === 'highlighter'
        ? {
            id: currentShapeId.current,
            type: 'highlighter' as const,
            x: worldPoint.x,
            y: worldPoint.y,
            scale: 1,
            rotation: 0,
            thickness: size,
            opacity,
            locked: false,
            points: [worldPoint],
            colorGradient: createDefaultHighlighterGradient(color),
            composite: 'multiply' as const,
            createdAt: now,
            updatedAt: now,
          }
        : {
            id: currentShapeId.current,
            type: 'pen' as const,
            x: worldPoint.x,
            y: worldPoint.y,
            scale: 1,
            rotation: 0,
            color,
            thickness: size,
            opacity,
            locked: false,
            points: [worldPoint],
            createdAt: now,
            updatedAt: now,
          };

      // Dev/test-only breadcrumbs (safe no-op in prod)
      try {
        if (import.meta.env.DEV && typeof window !== 'undefined') {
          const w = window as Window & {
            __WB_DEBUG_LAST_ADDED__?: { type: string; at: number };
          };
          w.__WB_DEBUG_LAST_ADDED__ = { type: newShape.type, at: now };
        }
      } catch {
        // ignore
      }

      addShape(newShape);
    },
    [addShape, canAnnotate, canvasRef, color, opacity, size, tool, getPointerWorld]
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDrawing.current || !currentShapeId.current) return;
      if (tool !== 'pen' && tool !== 'highlighter') return;

      const worldPoint = getPointerWorld(e);
      if (!worldPoint) return;

      const { shapes } = useWhiteboardStore.getState();
      const shape = shapes.get(currentShapeId.current);
      if (!shape || !('points' in shape) || !(shape as any).points || (shape as any).points.length < 1) return;

      // Continuous freehand: append points
      const newPoints = [...(shape as any).points, worldPoint];

      updateShape(currentShapeId.current, {
        points: newPoints,
        updatedAt: Date.now(),
      });

      // Dev/test-only breadcrumbs
      try {
        if (import.meta.env.DEV && typeof window !== 'undefined') {
          const w = window as Window & {
            __WB_DEBUG_LAST_UPDATED__?: { id: string; len: number; tool: string };
          };
          w.__WB_DEBUG_LAST_UPDATED__ = {
            id: currentShapeId.current,
            len: newPoints.length,
            tool,
          };
        }
      } catch {
        // ignore
      }

      e.preventDefault();
    },
    [getPointerWorld, tool, updateShape]
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (!isDrawing.current) return;
      if (tool !== 'pen' && tool !== 'highlighter') return;

      const canvas = canvasRef.current;
      if (canvas) {
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch {
          // non-fatal
        }
      }

      isDrawing.current = false;
      currentShapeId.current = null;

      if (transactionId.current) {
        const store = useWhiteboardStore.getState();
        store.saveHistory('draw');

        // Dev/test-only flag
        try {
          if (import.meta.env.DEV && typeof window !== 'undefined') {
            const w = window as Window & { __WB_DEBUG_UP__?: boolean };
            w.__WB_DEBUG_UP__ = true;
          }
        } catch {
          // ignore
        }

        transactionId.current = null;
      }

      e.preventDefault();
    },
    [canvasRef, tool]
  );

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
