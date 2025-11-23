// ============================================================================
// TALKING INDICATOR COMPONENT - Microsoft Enterprise Standard
// Shows visual indicator when user's microphone is active
// ============================================================================

import { faMicrophone } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { memo } from 'react';
import { useFluentIcons } from '../icons/useFluentIcons';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
interface TalkingIndicatorProps {
  /** Whether the user is currently actively talking (audio detected) */
  isTalking: boolean;
  /** Size variant for different contexts */
  size?: 'sm' | 'md' | 'lg';
  /** Optional custom class name */
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================
const SIZE_CLASSES = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6'
} as const;

// DOT_SIZE_CLASSES removed - will be needed when GIF implementation is added

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * TalkingIndicator - Visual indicator for active microphone
 * 
 * Microsoft Pattern: Memoized for performance, accessible, themeable
 * 
 * @example
 * ```tsx
 * <TalkingIndicator isTalking={isMicEnabled} size="md" />
 * ```
 */
export const TalkingIndicator = memo<TalkingIndicatorProps>(function TalkingIndicator({
  isTalking,
  size = 'sm',
  className = ''
}) {
  const fi = useFluentIcons();
  // Early return for performance - Microsoft pattern
  if (!isTalking) return null;

  // TODO: Replace with actual GIF when available
  // Uncomment below and remove the div when you have the GIF:
  // return (
  //   <img 
  //     src="/assets/images/talking.gif" 
  //     alt="Talking" 
  //     className={`absolute -bottom-1 -right-1 ${SIZE_CLASSES[size]} ${className}`}
  //     role="status"
  //     aria-label="User is speaking"
  //   />
  // );

  // Show microphone icon when talking
  return (
    <div 
      className={`absolute -bottom-1 -right-1 ${SIZE_CLASSES[size]} bg-green-500 rounded-full border-2 border-slate-800 flex items-center justify-center ${isTalking ? 'animate-pulse' : ''} ${className}`}
      title="Microphone active"
      role="status"
      aria-label="User is speaking"
    >
      {(() => {
        const I = fi?.Mic12Regular || fi?.Mic16Regular || fi?.Mic20Regular;
        if (I) {
          const C = I as React.ComponentType<{ width: number; height: number; className: string }>;
          const px = size === 'sm' ? 8 : size === 'md' ? 10 : 12;
          return <C width={px} height={px} className="text-white" />;
        }
        return (
          <FontAwesomeIcon 
            icon={faMicrophone} 
            className="text-white" 
            style={{ fontSize: size === 'sm' ? '8px' : size === 'md' ? '10px' : '12px' }}
          />
        );
      })()}
    </div>
  );
});

// Display name for React DevTools - Microsoft pattern
TalkingIndicator.displayName = 'TalkingIndicator';