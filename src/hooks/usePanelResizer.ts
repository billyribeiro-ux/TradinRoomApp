import { useState, useCallback, useRef } from 'react';

// Vendor-prefixed CSS properties for cross-browser user-select
// Note: Using type assertions with 'as any' for non-standard CSS properties

interface ResizerConfig {
  min: number;
  max: number;
  containerSize: number;
}

/**
 * Enterprise-grade panel resizer hook
 * Handles mouse/touch drag with proper offset calculation
 */
export function usePanelResizer(
  getConfig: () => ResizerConfig,
  setValue: (value: number) => void
): { isResizing: boolean; handleMouseDown: (e: React.MouseEvent | React.TouchEvent | React.PointerEvent, currentValue: number) => void } {
  const [isResizing, setIsResizing] = useState(false);
  const rafRef = useRef<number | undefined>(undefined);

  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent | React.PointerEvent, currentValue: number) => {
    e.preventDefault();
    
    const config = getConfig();
    
    // Check if pointer events are supported
    const isPointer = 'nativeEvent' in e && 'pointerType' in (e as React.PointerEvent).nativeEvent;
    
    // Get starting position
    const getClientX = (evt: MouseEvent | TouchEvent | PointerEvent): number =>
      'touches' in evt
        ? (evt).touches[0]?.clientX ?? 0
        : (evt).clientX;
    
    const startX = getClientX(e.nativeEvent);
    const startWidth = currentValue;
    
    setIsResizing(true);

    const handleMove = (moveEvent: MouseEvent | TouchEvent | PointerEvent): void => {
      moveEvent.preventDefault();
      
      // Cancel previous frame if still pending
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      const run = (): void => {
        // Calculate delta from start position
        const currentX = getClientX(moveEvent);
        const deltaX = currentX - startX;
        
        // New width = start width + delta
        const newValue = startWidth + deltaX;
        
        // Clamp to min/max
        const clamped = Math.max(config.min, Math.min(newValue, config.max));
        
        setValue(clamped);
      };
      
      rafRef.current = requestAnimationFrame(run);
    };

    const handleEnd = (): void => {
      try {
        // Cancel any pending animation frame
        if (rafRef.current !== undefined) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = undefined;
        }
      } catch (error) {
        // Ignore rAF cancellation errors
      }
      
      setIsResizing(false);
      
      try {
        // Remove all possible listeners
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('mouseleave', handleEnd);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleEnd);
        window.removeEventListener('touchcancel', handleEnd);
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleEnd);
        window.removeEventListener('pointerleave', handleEnd);
      } catch (error) {
        // Ignore listener removal errors
      }
      
      try {
        // Reset body styles in try/finally to ensure they always clear
        const bodyStyle = document.body.style;
        const style = bodyStyle as unknown as Record<string, string>;
        style.cursor = '';
        style.userSelect = '';
        style.webkitUserSelect = '';
        style.mozUserSelect = '';
        style.msUserSelect = '';
        style.touchAction = '';
        style.overflow = ''; // Restore original overflow
      } catch (error) {
        // Ignore style reset errors
      }
    };

    // Microsoft pattern: Prevent scrolling, text selection, and set cursor
  const bodyStyle = document.body.style;
  const style = bodyStyle as unknown as Record<string, string>;
  style.cursor = 'col-resize';
  style.userSelect = 'none';
  style.webkitUserSelect = 'none'; // Safari/Chrome
  style.mozUserSelect = 'none';    // Firefox
  style.msUserSelect = 'none';     // IE/Edge
  style.touchAction = 'none';
  style.overflow = 'hidden';      // Prevent scroll
    
    
    try {
      // Attach appropriate event listeners
      if (isPointer) {
        window.addEventListener('pointermove', handleMove, { passive: false });
        window.addEventListener('pointerup', handleEnd, { once: true });
        window.addEventListener('pointerleave', handleEnd, { once: true }); // Handle mouse leave
      } else {
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd, { once: true });
        window.addEventListener('mouseleave', handleEnd, { once: true }); // Handle mouse leave
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleEnd, { once: true });
        window.addEventListener('touchcancel', handleEnd, { once: true }); // Handle touch cancel
      }
    } catch (error) {
      // Ensure cleanup runs even if event attachment fails
      handleEnd();
      throw error;
    }
  }, [getConfig, setValue]);

  return { isResizing, handleMouseDown };
}
