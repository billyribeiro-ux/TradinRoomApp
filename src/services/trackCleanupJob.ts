import { TIMING } from '../config/constants';

import { cleanupStaleMediaTracksHeartbeat } from './api';
// Fixed: 2025-10-24 - Emergency null/undefined fixes for production
// Microsoft TypeScript standards applied - null → undefined, using optional types


// Fixed: 2025-01-24 - Eradicated 4 null usage(s) - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types


class TrackCleanupJob {
  private intervalId: NodeJS.Timeout | undefined  = undefined;
  private currentRoomId: string | undefined  = undefined;
  private isRunning: boolean = false;
  private lastStartTime: number = 0;
  private startDebounceMs: number = 100; // Prevent rapid successive starts

  start(roomId: string, intervalMs: number = TIMING.cleanupInterval) {
    // Debounce rapid successive starts (React strict mode double mounting)
    const now = Date.now();
    if (this.isRunning && this.currentRoomId === roomId) {
      if (now - this.lastStartTime < this.startDebounceMs) {
        return; // Silent return within debounce window
      }
      console.log('[CleanupJob] Already running for room:', roomId);
      return;
    }

    this.lastStartTime = now;

    this.stop();

    this.currentRoomId = roomId;
    this.isRunning = true;

    console.log('[CleanupJob] Starting cleanup job for room:', roomId, 'interval:', intervalMs);

    this.runCleanup();

    this.intervalId = setInterval(() => {
      this.runCleanup();
    }, intervalMs);
  }

  private async runCleanup() {
    if (!this.currentRoomId) return;

    try {
      const cleanedCount = await cleanupStaleMediaTracksHeartbeat(this.currentRoomId, 2);

      if (cleanedCount > 0) {
        console.log('[CleanupJob] Cleaned up stale tracks:', cleanedCount);
      }
    } catch (error) {
      console.error('[CleanupJob] Error during cleanup:', error);
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId  = undefined;
      console.log('[CleanupJob] Stopped cleanup job for room:', this.currentRoomId);
    }
    this.isRunning = false;
    this.currentRoomId  = undefined;
  }

  isActive(): boolean {
    return this.isRunning;
  }
}

export const trackCleanupJob = new TrackCleanupJob();
