// ============================================================================
// DRAGGABLE HOOK - Toolbar Drag & Resize
// ============================================================================

import { useCallback, useRef, useState, useEffect } from 'react';

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
}

interface DraggableOptions {
  initialPosition?: Position;
  initialSize?: Size;
  bounds?: { width: number; height: number };
  persistKey?: string;
}

export function useDraggable({
  initialPosition = { x: 16, y: 16 },
  initialSize = { width: 280 },
  bounds,
  persistKey = 'whiteboard.toolbar',
}: DraggableOptions) {
  // Load persisted state
  const [position, setPosition] = useState<Position>(() => {
    if (typeof window === 'undefined') return initialPosition;
    
    try {
      const savedX = localStorage.getItem(`${persistKey}.x`);
      const savedY = localStorage.getItem(`${persistKey}.y`);
      
      if (savedX && savedY) {
        return { x: parseFloat(savedX), y: parseFloat(savedY) };
      }
    } catch {
      // localStorage not available
    }
    return initialPosition;
  });

  const [size, setSize] = useState<Size>(() => {
    if (typeof window === 'undefined') return initialSize;
    
    try {
      const savedW = localStorage.getItem(`${persistKey}.w`);
      if (savedW) {
        return { width: parseFloat(savedW) };
      }
    } catch {
      // localStorage not available
    }
    return initialSize;
  });

  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef(0);
  const rafId = useRef<number | undefined>(undefined);

  // Persist to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(`${persistKey}.x`, position.x.toString());
      localStorage.setItem(`${persistKey}.y`, position.y.toString());
      localStorage.setItem(`${persistKey}.w`, size.width.toString());
    } catch {
      // localStorage not available
    }
  }, [position, size, persistKey]);

  const handleDragStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    isDragging.current = true;
    startPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    if (typeof document !== 'undefined') {
      document.body.style.userSelect = 'none';
      document.body.style.touchAction = 'none';
    }
  }, [position]);

  const handleDragMove = useCallback((e: PointerEvent) => {
    if (!isDragging.current) return;
    
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
    
    rafId.current = requestAnimationFrame(() => {
      let newX = e.clientX - startPos.current.x;
      let newY = e.clientY - startPos.current.y;
      
      // Constrain to bounds
      if (bounds) {
        newX = Math.max(0, Math.min(newX, bounds.width - size.width));
        newY = Math.max(0, Math.min(newY, bounds.height - 400)); // Approximate toolbar height
      }
      
      setPosition({ x: newX, y: newY });
    });
  }, [bounds, size.width]);

  const handleDragEnd = useCallback((_e: PointerEvent) => {
    if (!isDragging.current) return;
    
    isDragging.current = false;
    
    if (typeof document !== 'undefined') {
      document.body.style.userSelect = '';
      document.body.style.touchAction = '';
    }
    
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
  }, []);

  const handleResizeStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    isResizing.current = true;
    startPos.current = { x: e.clientX, y: 0 };
    startSize.current = size.width;
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    if (typeof document !== 'undefined') {
      document.body.style.userSelect = 'none';
      document.body.style.touchAction = 'none';
    }
  }, [size.width]);

  const handleResizeMove = useCallback((e: PointerEvent) => {
    if (!isResizing.current) return;
    
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
    
    rafId.current = requestAnimationFrame(() => {
      const delta = e.clientX - startPos.current.x;
      const newWidth = Math.max(200, Math.min(600, startSize.current + delta));
      
      setSize({ width: newWidth });
    });
  }, []);

  const handleResizeEnd = useCallback((_e?: PointerEvent) => {
    if (!isResizing.current) return;
    
    isResizing.current = false;
    
    if (typeof document !== 'undefined') {
      document.body.style.userSelect = '';
      document.body.style.touchAction = '';
    }
    
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
  }, []);

  // Attach global listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleMove = (e: PointerEvent) => {
      handleDragMove(e);
      handleResizeMove(e);
    };
    
    const handleEnd = (e: PointerEvent) => {
      handleDragEnd(e);
      handleResizeEnd();
    };
    
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleEnd);
    window.addEventListener('pointercancel', handleEnd);
    
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleEnd);
      window.removeEventListener('pointercancel', handleEnd);
    };
  }, [handleDragMove, handleDragEnd, handleResizeMove, handleResizeEnd]);

  return {
    position,
    size,
    handleDragStart,
    handleResizeStart,
    isDragging: isDragging.current,
    isResizing: isResizing.current,
  };
}
