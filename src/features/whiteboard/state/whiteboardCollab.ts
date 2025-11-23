// ============================================================================
// WHITEBOARD COLLABORATION - Real-time Sync
// ============================================================================
// Collaboration adapter for LiveKit/Supabase Realtime
// ============================================================================

import type { WhiteboardEvent, WhiteboardShape, RemoteCursor } from '../types';
import { useWhiteboardStore } from './whiteboardStore';

// ============================================================================
// Batched Updates to Prevent Network Flooding
// ============================================================================
const pendingUpdates = new Map<string, WhiteboardEvent>();
let updateTimer: NodeJS.Timeout | null = null;
let batchEmitFunction: ((events: WhiteboardEvent[]) => void) | null = null;

/**
 * Set the emit function for batched updates
 */
export function setBatchEmitFunction(emit: (events: WhiteboardEvent[]) => void): void {
  batchEmitFunction = emit;
}

/**
 * Flush pending updates immediately
 */
export function flushPendingUpdates(): void {
  if (pendingUpdates.size === 0 || !batchEmitFunction) return;
  
  const events = Array.from(pendingUpdates.values());
  batchEmitFunction(events);
  pendingUpdates.clear();
  
  if (updateTimer) {
    clearTimeout(updateTimer);
    updateTimer = null;
  }
}

/**
 * Add event to batch queue
 */
function queueUpdate(event: WhiteboardEvent): void {
  const key = `${event.type}_${event.userId}_${event.timestamp}`;
  pendingUpdates.set(key, event);
  
  // Cancel existing timer
  if (updateTimer) {
    clearTimeout(updateTimer);
  }
  
  // Set new timer for 16ms (60fps)
  updateTimer = setTimeout(() => {
    flushPendingUpdates();
  }, 16);
}

/**
 * Process incoming collaboration event
 */
export function processIncomingEvent(event: WhiteboardEvent): void {
  const store = useWhiteboardStore.getState();
  
  switch (event.type) {
    case 'shape:add':
      if (event.payload && 'shape' in (event.payload as any)) {
        store.addShape((event.payload as any).shape);
      }
      break;
      
    case 'shape:update':
      if (event.payload && 'shape' in (event.payload as any)) {
        const shape = (event.payload as any).shape;
        store.updateShape(shape.id, shape);
      }
      break;
      
    case 'shape:delete':
      if (event.payload && 'shapeId' in (event.payload as any)) {
        store.deleteShape((event.payload as any).shapeId);
      }
      break;
      
    case 'cursor:move':
      if (event.payload && 'cursor' in (event.payload as any) && event.userId) {
        store.updateRemoteCursor(event.userId, (event.payload as any).cursor);
      }
      break;
      
    case 'stroke:clear':
      store.clearShapes();
      break;
  }
}

/**
 * Create collaboration event for broadcasting
 */
export function createCollabEvent(
  type: WhiteboardEvent['type'],
  roomId: string,
  userId: string,
  payload: WhiteboardEvent['payload']
): WhiteboardEvent {
  return {
    type,
    timestamp: Date.now(),
    data: payload, // Required field
    payload, // Optional field for backwards compatibility
    roomId, // Optional field
    userId, // Optional field
  };
}

/**
 * Broadcast shape add event (with batching)
 */
export function broadcastShapeAdd(
  shape: WhiteboardShape,
  roomId: string,
  userId: string,
  emit?: (event: WhiteboardEvent) => void
): void {
  const event = createCollabEvent('shape:add', roomId, userId, { shape });
  
  if (batchEmitFunction) {
    // Use batched updates to prevent network flooding
    queueUpdate(event);
  } else if (emit) {
    // Fallback to direct emit if batching not configured
    emit(event);
  }
}

/**
 * Broadcast cursor move event
 */
export function broadcastCursorMove(
  cursor: RemoteCursor,
  roomId: string,
  userId: string,
  emit?: (event: WhiteboardEvent) => void
): void {
  if (!emit) return;
  
  const event = createCollabEvent('cursor:move', roomId, userId, { cursor });
  emit(event);
}

/**
 * Remove stale remote cursors (older than 5 seconds)
 */
export function cleanupStaleCursors(): void {
  const store = useWhiteboardStore.getState();
  const now = Date.now();
  const staleThreshold = 5000; // 5 seconds
  
  store.remoteCursors.forEach((cursor, userId) => {
    if (now - cursor.timestamp > staleThreshold) {
      store.removeRemoteCursor(userId);
    }
  });
}

/**
 * Initialize collaboration cleanup interval
 */
export function startCollabCleanup(): () => void {
  const interval = setInterval(cleanupStaleCursors, 1000);
  
  return () => clearInterval(interval);
}
