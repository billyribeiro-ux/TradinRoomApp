/**
 * audioContextManager.ts
 * ------------------------------------------------------------
 * Microsoft-standard AudioContext lifecycle management
 * Handles browser autoplay policies and user interaction requirements
 * 
 * Purpose:
 * - Centralized AudioContext state management
 * - Handles browser autoplay policy gracefully
 * - Provides observable state for UI components
 * - Follows Microsoft Edge team best practices
 */

export type AudioContextState = 'uninitialized' | 'suspended' | 'running' | 'closed';

export interface AudioContextStatus {
  state: AudioContextState;
  requiresUserGesture: boolean;
  lastError?: Error;
}

/**
 * AudioContextManager
 * Singleton service for managing Web Audio API AudioContext lifecycle
 */
class AudioContextManager {
  private context: AudioContext | undefined;
  private callbacks: Set<(status: AudioContextStatus) => void> = new Set();

  /**
   * Get current AudioContext status
   * @returns Current state and whether user gesture is required
   */
  public getStatus(): AudioContextStatus {
    if (!this.context) {
      return {
        state: 'uninitialized',
        requiresUserGesture: true,
      };
    }

    return {
      state: this.context.state as AudioContextState,
      requiresUserGesture: this.context.state === 'suspended',
    };
  }

  /**
   * Resume AudioContext after user gesture
   * Must be called in response to user interaction (click, touch, etc.)
   * 
   * @throws {Error} If AudioContext not initialized
   */
  public async resumeContext(): Promise<void> {
    if (!this.context) {
      throw new Error('AudioContext not initialized. Call initialize() first.');
    }

    if (this.context.state === 'suspended') {
      console.log('[AudioContextManager] Resuming AudioContext after user gesture');
      
      try {
        await this.context.resume();
        console.log('[AudioContextManager] ✅ AudioContext resumed, state:', this.context.state);
        this.notifySubscribers();
      } catch (error) {
        console.error('[AudioContextManager] ❌ Failed to resume AudioContext:', error);
        throw error;
      }
    } else {
      console.debug('[AudioContextManager] AudioContext already running');
    }
  }

  /**
   * Initialize AudioContext
   * Note: May be suspended until user gesture due to browser autoplay policy
   */
  public async initialize(): Promise<void> {
    if (this.context) {
      console.debug('[AudioContextManager] AudioContext already initialized');
      return;
    }

    try {
      this.context = new AudioContext();
      console.log('[AudioContextManager] AudioContext initialized, state:', this.context.state);
      
      if (this.context.state === 'suspended') {
        console.warn('[AudioContextManager] ⚠️ AudioContext suspended by browser - requires user gesture');
      }
      
      this.notifySubscribers();
    } catch (error) {
      console.error('[AudioContextManager] ❌ Failed to initialize AudioContext:', error);
      throw error;
    }
  }

  /**
   * Subscribe to AudioContext state changes
   * @param callback - Function called when AudioContext state changes
   * @returns Unsubscribe function
   */
  public subscribe(callback: (status: AudioContextStatus) => void): () => void {
    this.callbacks.add(callback);
    
    // Immediately notify with current state
    callback(this.getStatus());
    
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Notify all subscribers of state change
   */
  private notifySubscribers(): void {
    const status = this.getStatus();
    this.callbacks.forEach(cb => {
      try {
        cb(status);
      } catch (error) {
        console.error('[AudioContextManager] Subscriber callback error:', error);
      }
    });
  }

  /**
   * Get AudioContext instance
   * For services that need direct access to AudioContext
   * 
   * @returns AudioContext instance or undefined if not initialized
   */
  public getContext(): AudioContext | undefined {
    return this.context;
  }

  /**
   * Close AudioContext (cleanup)
   * Should be called when audio is no longer needed
   */
  public async close(): Promise<void> {
    if (this.context && this.context.state !== 'closed') {
      console.log('[AudioContextManager] Closing AudioContext');
      await this.context.close();
      this.context = undefined;
      this.notifySubscribers();
    }
  }
}

// Export singleton instance
export const audioContextManager = new AudioContextManager();

