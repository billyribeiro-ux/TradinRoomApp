// ============================================================================
// HISTORY UTILITIES - Undo/Redo with Batching
// ============================================================================

import type { HistoryEntry, WhiteboardAnnotation } from '../types';

interface BatchState {
  action: string;
  startSnapshot: Map<string, WhiteboardAnnotation>;
  startTime: number;
}

let currentBatch: BatchState | null = null;

export function beginBatch(action: string, snapshot: Map<string, WhiteboardAnnotation>) {
  if (currentBatch) {
    console.warn('[History] Batch already in progress, committing previous batch');
    commitBatch(snapshot);
  }
  
  currentBatch = {
    action,
    startSnapshot: new Map(snapshot),
    startTime: Date.now(),
  };
}

export function commitBatch(endSnapshot: Map<string, WhiteboardAnnotation>): HistoryEntry | null {
  if (!currentBatch) {
    return null;
  }
  
  const entry: any = {
    id: `history-${Date.now()}`,
    action: currentBatch.action,
    timestamp: currentBatch.startTime,
    shapes: new Map(endSnapshot),
    viewport: {} as any,
    data: {
      before: currentBatch.startSnapshot,
      after: new Map(endSnapshot),
    },
    snapshot: new Map(endSnapshot),
  };
  
  currentBatch = null;
  return entry;
}

export function rollbackBatch() {
  currentBatch = null;
}

export function isBatchActive(): boolean {
  return currentBatch !== null;
}

export function getCurrentBatch(): BatchState | null {
  return currentBatch;
}
