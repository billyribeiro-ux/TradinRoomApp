/**
 * HorizontalResizeHandle - Microsoft Fluent Design System
 * =========================================================
 * Enterprise-grade horizontal splitter with Fluent 2 design language
 * - Acrylic background material
 * - Reveal highlight on hover
 * - Smooth transitions with easing
 * - WCAG 2.1 AA compliant
 */

import React, { useCallback, useState } from 'react';

// --- FIXED: Added a matching Props interface ---
export interface HorizontalResizeHandleProps {
  /**
   * Universal pointer event handler for drag start (mouse, touch, pen).
   */
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  
  /**
   * Callback for keyboard resize (ArrowUp/Down).
   * Provides the pixel delta.
   */
  onKeyboardDelta?: (delta: number) => void;
  
  /**
   * Callback for keyboard snap to minimum (Home key).
   */
  onKeyboardHome?: () => void;
  
  /**
   * Callback for keyboard snap to maximum (End key).
   */
  onKeyboardEnd?: () => void;
  
  // --- Standard ARIA / layout props from your trace ---
  role?: string;
  ariaOrientation?: 'horizontal' | 'vertical';
  ariaValueMin: number;
  ariaValueMax: number;
  ariaValueNow: number;
  step?: number;
  stepLarge?: number;
  disabled?: boolean;
  'data-testid'?: string;
}

export const HorizontalResizeHandle = React.memo(function HorizontalResizeHandle({
  onPointerDown,
  role = 'separator',
  ariaOrientation = 'horizontal',
  ariaValueMin,
  ariaValueMax,
  ariaValueNow,
  step = 8,
  stepLarge = 24,
  onKeyboardDelta,
  onKeyboardHome,
  onKeyboardEnd,
  disabled = false,
  'data-testid': dataTestId = 'alerts-chat-separator',
}: HorizontalResizeHandleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Lines 67-89: Keyboard Resize Handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const isLarge = e.shiftKey;
    const d = isLarge ? stepLarge : step;
    
    switch (e.key) {
      case 'ArrowUp': // FIXED: Up = Shrink
        e.preventDefault();
        onKeyboardDelta?.(-d);
        break;
      case 'ArrowDown': // FIXED: Down = Grow
        e.preventDefault();
        onKeyboardDelta?.(+d);
        break;
      case 'Home':
        e.preventDefault();
        onKeyboardHome?.(); // Snap to min
        break;
      case 'End':
        e.preventDefault();
        onKeyboardEnd?.(); // Snap to max
        break;
    }
  }, [disabled, step, stepLarge, onKeyboardDelta, onKeyboardHome, onKeyboardEnd]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    setIsPressed(true);
    onPointerDown(e);
  }, [onPointerDown]);

  const handlePointerUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  // Lines 91-107: Render JSX
  return (
    <div
      data-testid={dataTestId}
      role={role}
      aria-label="Resize between alerts and chat"
      aria-orientation={ariaOrientation}
      aria-valuemin={ariaValueMin}
      aria-valuemax={ariaValueMax}
      aria-valuenow={ariaValueNow}
      tabIndex={disabled ? -1 : 0}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      style={{
        position: 'relative',
        height: '14px',
        cursor: 'row-resize',
        zIndex: 100,
        touchAction: 'none',
        // Base color: #3B82F6
        background: 'rgba(59, 130, 246, 1)',
        // Fluent effects only on hover/press
        backdropFilter: isHovered ? 'blur(40px) saturate(180%)' : 'none',
        WebkitBackdropFilter: isHovered ? 'blur(40px) saturate(180%)' : 'none',
        borderTop: isHovered ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(59, 130, 246, 0.8)',
        borderBottom: isHovered ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(59, 130, 246, 0.8)',
        // Enhanced Fluent Reveal effects on interaction
        boxShadow: isPressed
          ? '0 0 40px rgba(59, 130, 246, 0.9), 0 0 80px rgba(59, 130, 246, 0.6), 0 0 120px rgba(59, 130, 246, 0.4), inset 0 0 30px rgba(255, 255, 255, 0.3)'
          : isHovered
          ? '0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(59, 130, 246, 0.5), 0 0 90px rgba(59, 130, 246, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.2)'
          : 'none',
        // Smooth transitions with Fluent easing
        transition: 'all 167ms cubic-bezier(0.33, 0, 0.67, 1)',
        filter: isPressed 
          ? 'brightness(1.3) saturate(1.2)' 
          : isHovered 
          ? 'brightness(1.15) saturate(1.1)' 
          : 'none',
      }}
    >
      {/* Fluent Grip Indicator - Always visible */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'row',
          gap: '3px',
          opacity: isPressed ? 1 : isHovered ? 0.9 : 0.6,
          transition: 'opacity 100ms cubic-bezier(0.33, 0, 0.67, 1)',
        }}
      >
        <div style={{
          width: '3px',
          height: '3px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.9)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
        }} />
        <div style={{
          width: '3px',
          height: '3px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.9)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
        }} />
        <div style={{
          width: '3px',
          height: '3px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.9)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
        }} />
      </div>
    </div>
  );
});