/**
 * VerticalResizeHandle - Microsoft Fluent Design System
 * =========================================================
 * Enterprise-grade vertical splitter with Fluent 2 design language
 * - Acrylic background material
 * - Reveal highlight on hover
 * - Smooth transitions with easing
 * - WCAG 2.1 AA compliant
 */

import React, { useCallback, useState } from 'react';

export interface VerticalResizeHandleProps {
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onKeyboardDelta?: (delta: number) => void;
  onKeyboardHome?: () => void;
  onKeyboardEnd?: () => void;
  role?: string;
  ariaOrientation?: 'horizontal' | 'vertical';
  ariaValueMin: number;
  ariaValueMax: number;
  ariaValueNow: number;
  step?: number;
  stepLarge?: number;
  disabled?: boolean;
  side?: 'left' | 'right';
  'data-testid'?: string;
}

export const VerticalResizeHandle = React.memo(function VerticalResizeHandle({
  onPointerDown,
  role = 'separator',
  ariaOrientation = 'vertical',
  ariaValueMin,
  ariaValueMax,
  ariaValueNow,
  step = 8,
  stepLarge = 24,
  onKeyboardDelta,
  onKeyboardHome,
  onKeyboardEnd,
  disabled = false,
  side,
  'data-testid': dataTestId = 'left-main-separator',
}: VerticalResizeHandleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const isLarge = e.shiftKey;
    const d = isLarge ? stepLarge : step;
    
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        onKeyboardDelta?.(+d);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onKeyboardDelta?.(-d);
        break;
      case 'Home':
        e.preventDefault();
        onKeyboardHome?.();
        break;
      case 'End':
        e.preventDefault();
        onKeyboardEnd?.();
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

  return (
    <div
      data-testid={dataTestId}
      data-side={side}
      role={role}
      aria-label="Resize between chat column and main stage"
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
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: '14px',
        cursor: 'col-resize',
        zIndex: 100,
        touchAction: 'none',
        // Base color: #3B82F6
        background: 'rgba(59, 130, 246, 1)',
        // Fluent effects only on hover/press
        backdropFilter: isHovered ? 'blur(40px) saturate(180%)' : 'none',
        WebkitBackdropFilter: isHovered ? 'blur(40px) saturate(180%)' : 'none',
        borderLeft: isHovered ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(59, 130, 246, 0.8)',
        borderRight: isHovered ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(59, 130, 246, 0.8)',
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
          flexDirection: 'column',
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