// ============================================================================
// WHITEBOARD SURFACE - Fixed-size container (L65 hardened)
// ============================================================================
// Enforces exact logical viewport size with no stretching or transforms.
// Parent defines layout box; canvas inside uses same logical dimensions.
// ============================================================================

import type { PropsWithChildren } from 'react';

interface Props {
  width: number;   // logical CSS px
  height: number;  // logical CSS px
  className?: string;
}

export function WhiteboardSurface({ width, height, className, children }: PropsWithChildren<Props>) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: `${width}px`,
        height: `${height}px`,
        overflow: 'hidden',
      }}
      data-testid="whiteboard-surface"
    >
      {children}
    </div>
  );
}
