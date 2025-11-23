// ============================================================================
// REMOTE CURSORS - Multi-user Cursor Display
// ============================================================================
// Show remote user cursors with names and colors
// ============================================================================

import { useWhiteboardStore } from '../state/whiteboardStore';
import { worldToScreen } from '../utils/transform';

interface RemoteCursorsProps {
  width: number;
  height: number;
}

export function RemoteCursors({ width, height }: RemoteCursorsProps) {
  const remoteCursors = useWhiteboardStore((s) => s.remoteCursors);
  const viewport = useWhiteboardStore((s) => s.viewport);
  
  const viewportState = {
    ...viewport,
    width,
    height,
  };
  
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {Array.from(remoteCursors.values()).map((cursor) => {
        const screenPos = worldToScreen(cursor.position, viewportState as any);
        
        return (
          <div
            key={cursor.userId}
            className="absolute transition-all duration-100"
            style={{
              left: screenPos.x,
              top: screenPos.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Cursor dot */}
            <div
              className="w-3 h-3 rounded-full border-2 border-white shadow-lg"
              style={{ backgroundColor: cursor.color }}
            />
            
            {/* User name label */}
            <div
              className="absolute top-4 left-4 px-2 py-1 rounded text-xs text-white shadow-lg whitespace-nowrap"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.userName}
            </div>
          </div>
        );
      })}
    </div>
  );
}
