import { TIMING } from '../config/constants';
import { supabase } from '../lib/supabase';

class TrackHeartbeatService {
  private heartbeatIntervals: Map<string, number> = new Map();
  private sessionId: string = '';

  initialize() {
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('[Heartbeat] Session initialized:', this.sessionId);
  }

  getSessionId(): string {
    return this.sessionId;
  }

  async startHeartbeat(trackId: string, intervalMs: number = TIMING.heartbeatInterval) {
    if (this.heartbeatIntervals.has(trackId)) {
      console.log('[Heartbeat] Already running for track:', trackId);
      return;
    }

    console.log('[Heartbeat] Starting heartbeat for track:', trackId, 'interval:', intervalMs);

    await this.sendHeartbeat(trackId);

    const interval = setInterval(async () => {
      await this.sendHeartbeat(trackId);
    }, intervalMs) as unknown as number;

    this.heartbeatIntervals.set(trackId, interval);
  }

  private async sendHeartbeat(trackId: string) {
    try {
      const { error } = await supabase
        .from('mediatrack')
        .update({
          last_heartbeat_at: new Date().toISOString()
        } as unknown as Record<string, string>)
        .eq('id', trackId)
        .is('ended_at', null);

      if (error) {
        console.error('[Heartbeat] Failed to send heartbeat for track:', trackId, error);
      }
    } catch (error) {
      console.error('[Heartbeat] Exception sending heartbeat:', error);
    }
  }

  stopHeartbeat(trackId: string) {
    const interval = this.heartbeatIntervals.get(trackId);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(trackId);
      console.log('[Heartbeat] Stopped heartbeat for track:', trackId);
    }
  }

  stopAllHeartbeats() {
    console.log('[Heartbeat] Stopping all heartbeats, count:', this.heartbeatIntervals.size);
    for (const [trackId, interval] of this.heartbeatIntervals.entries()) {
      clearInterval(interval);
      console.log('[Heartbeat] Stopped heartbeat for track:', trackId);
    }
    this.heartbeatIntervals.clear();
  }

  async cleanupSessionTracks() {
    if (!this.sessionId) {
      console.log('[Heartbeat] No session ID, skipping cleanup');
      return 0;
    }

    console.log('[Heartbeat] Cleaning up session tracks:', this.sessionId);

    try {
      // First, find tracks to cleanup
      const { data: tracksToCleanup, error: queryError } = await supabase
        .from('mediatrack')
        .select('id')
        .eq('session_id', this.sessionId)
        .is('ended_at', null);

      if (queryError) {
        console.log('[Heartbeat] Query error (non-critical):', queryError.message);
        return 0;
      }

      if (!tracksToCleanup || tracksToCleanup.length === 0) {
        console.log('[Heartbeat] No tracks to cleanup for session:', this.sessionId);
        return 0;
      }

      // Update tracks by ID
      const trackIds = tracksToCleanup.map((t: any) => t.id);
      const { data, error } = await supabase
        .from('mediatrack')
        .update({
          ended_at: new Date().toISOString()
        } as unknown as Record<string, string>)
        .in('id', trackIds);

      if (error) {
        console.log('[Heartbeat] Cleanup completed with error (tracks may have already been cleaned):', error.message);
        return 0;
      }

      const cleanedCount = data?.length || 0;
      console.log('[Heartbeat] Cleaned up tracks:', cleanedCount);
      return cleanedCount;
    } catch (error) {
      console.log('[Heartbeat] Exception during session cleanup (non-critical):', error instanceof Error ? error.message : 'Unknown error');
      return 0;
    }
  }

  getActiveHeartbeats(): string[] {
    return Array.from(this.heartbeatIntervals.keys());
  }
}

export const trackHeartbeatService = new TrackHeartbeatService();
