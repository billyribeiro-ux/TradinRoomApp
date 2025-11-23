/**
 * Audio Service
 * Manages audio input/output for trading room
 * Created: Emergency fix for 500 errors
 * Fixed: 2025-10-26 - Silenced expected permission errors
 * Fixed: 2025-10-26 - Microsoft-standard AudioContext management with browser autoplay policy handling
 */

import { audioContextManager } from './audioContextManager';

class AudioService {
  private audioContext: AudioContext | undefined = undefined;
  private audioStream: MediaStream | undefined = undefined;
  
  /**
   * Initialize audio service with proper AudioContext management
   * AudioContext may be suspended until user gesture (browser autoplay policy)
   */
  async initialize(): Promise<void> {
    try {
      console.log('[AudioService] Initializing audio service...');
      
      // Initialize AudioContext through manager (may be suspended by browser)
      await audioContextManager.initialize();
      
      const status = audioContextManager.getStatus();
      
      if (status.requiresUserGesture) {
        console.log('[AudioService] ⚠️ AudioContext suspended - will activate on user interaction');
      } else {
        console.log('[AudioService] ✅ AudioContext running');
      }

      // Store reference to AudioContext
      this.audioContext = audioContextManager.getContext();
      
      console.log('[AudioService] Audio service initialized');
    } catch (error) {
      console.debug('[AudioService] Initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Get audio stream
   */
  getStream(): MediaStream | undefined {
    return this.audioStream;
  }
  
  /**
   * Start microphone
   * Resumes AudioContext if suspended (user gesture present)
   */
  async startMicrophone(): Promise<void> {
    try {
      // Resume AudioContext if needed (user gesture present since this is called from button)
      await audioContextManager.resumeContext();
      
      // Initialize audio service if not already done
      if (!this.audioStream) {
        // Request microphone access
        this.audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        });
      }
      
      console.log('[AudioService] ✅ Microphone started');
    } catch (error) {
      console.debug('[AudioService] Failed to start microphone:', error);
      throw error;
    }
  }
  
  /**
   * Stop microphone
   */
  stopMicrophone(): void {
    if (this.audioStream) {
      this.audioStream.getAudioTracks().forEach(track => track.stop());
      this.audioStream = undefined;
    }
    console.log('[AudioService] Microphone stopped');
  }
  
  /**
   * Mute/unmute audio
   */
  setMuted(muted: boolean): void {
    if (this.audioStream) {
      this.audioStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }
  
  /**
   * Check if microphone is active
   */
  isActive(): boolean {
    return this.audioStream !== undefined && this.audioStream.getAudioTracks().some(track => track.enabled);
  }
  
  /**
   * Mute microphone
   */
  muteMicrophone(): void {
    if (this.audioStream) {
      this.audioStream.getAudioTracks().forEach(track => {
        track.enabled = false;
      });
    }
  }
  
  /**
   * Unmute microphone
   */
  unmuteMicrophone(): void {
    if (this.audioStream) {
      this.audioStream.getAudioTracks().forEach(track => {
        track.enabled = true;
      });
    }
  }
  
  /**
   * Get current mute state
   */
  isMuted(): boolean {
    if (!this.audioStream) return true;
    const tracks = this.audioStream.getAudioTracks();
    return tracks.length > 0 ? !tracks[0].enabled : true;
  }
  
  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    console.log('[AudioService] Cleaning up...');
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = undefined;
    }
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        await this.audioContext.close();
      } catch (error) {
        console.warn('[AudioService] Error closing AudioContext:', error);
      }
    }
    
    this.audioContext = undefined;
    console.log('[AudioService] Cleaned up');
  }
}

// Export singleton instance
export const audioService = new AudioService();
export default audioService;