/**
 * Camera Service
 * Manages video input for trading room
 * Created: Emergency fix for 500 errors
 */

class CameraService {
  private videoStream: MediaStream | undefined = undefined;
  
  /**
   * Initialize camera
   */
  async initialize(): Promise<void> {
    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        }
      });
      
      console.log('[CameraService] Initialized successfully');
    } catch (error) {
      console.error('[CameraService] Initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Get video stream
   */
  getStream(): MediaStream | undefined {
    return this.videoStream;
  }
  
  /**
   * Start camera with permission check
   */
  async startCamera(): Promise<void> {
    try {
      // Check camera permission before requesting access
      if ('permissions' in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
          if (permission.state === 'denied') {
            console.warn('[CameraService] Camera permission denied');
            throw new Error('Camera access denied. Please enable camera permissions in your browser settings.');
          }
        } catch (permError) {
          // Permission API may not be supported or may throw
          console.debug('[CameraService] Permission query failed (non-critical):', permError);
        }
      }
      
      await this.initialize();
      console.log('[CameraService] Camera started');
    } catch (error) {
      console.error('[CameraService] Failed to start camera:', error);
      throw error;
    }
  }
  
  /**
   * Stop camera
   */
  stopCamera(): void {
    if (this.videoStream) {
      this.videoStream.getVideoTracks().forEach(track => track.stop());
      this.videoStream = undefined;
    }
    console.log('[CameraService] Camera stopped');
  }
  
  /**
   * Check if camera is active
   */
  isActive(): boolean {
    return this.videoStream !== undefined && this.videoStream.getVideoTracks().some(track => track.enabled);
  }
  
  /**
   * Enable/disable video
   */
  setEnabled(enabled: boolean): void {
    if (this.videoStream) {
      this.videoStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }
  
  /**
   * Check if camera is enabled
   */
  isEnabled(): boolean {
    if (!this.videoStream) return false;
    const tracks = this.videoStream.getVideoTracks();
    return tracks.length > 0 ? tracks[0].enabled : false;
  }
  
  /**
   * Switch camera (front/back on mobile)
   */
  async switchCamera(): Promise<void> {
    // Placeholder for camera switching logic
    console.log('[CameraService] Camera switching not yet implemented');
  }
  
  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = undefined;
    }
    
    console.log('[CameraService] Cleaned up');
  }
}

// Export singleton instance
export const cameraService = new CameraService();
export default cameraService;
