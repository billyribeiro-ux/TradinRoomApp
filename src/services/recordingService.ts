/**
 * Recording Service - Microsoft Enterprise Pattern
 * Manages screen share recording with high quality settings
 * Fixed: Now properly records screen share instead of camera
 */

class RecordingService {
  private mediaRecorder: MediaRecorder | undefined = undefined;
  private recordedChunks: Blob[] = [];
  private isRecording = false;
  private recordingStartTime: number = 0;
  private currentStream: MediaStream | undefined = undefined;
  
  /**
   * Initialize the recording service
   */
  async initialize() {
    console.log('[RecordingService] Initializing...');
    // Check MediaRecorder support
    if (!window.MediaRecorder) {
      throw new Error('MediaRecorder API not supported in this browser');
    }
  }
  
  /**
   * Cleanup resources
   */
  async cleanup() {
    console.log('[RecordingService] Cleaning up...');
    if (this.isRecording && this.mediaRecorder) {
      await this.stopRecording();
    }
    this.mediaRecorder = undefined;
    this.recordedChunks = [];
    this.currentStream = undefined;
  }
  
  /**
   * Start recording screen share
   * @param stream - MediaStream from screen share (not camera!)
   */
  async startRecording(stream: MediaStream) {
    try {
      this.recordedChunks = [];
      this.currentStream = stream;
      this.recordingStartTime = Date.now();
      
      // Try different codecs in order of preference (best quality first)
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',  // Best quality
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4'
      ];
      
      let selectedMimeType = 'video/webm';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          console.log(`[RecordingService] Using codec: ${mimeType}`);
          break;
        }
      }
      
      // Create recorder with high quality settings
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps for high quality
        audioBitsPerSecond: 128000,  // 128 kbps for audio
      });
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
          console.log(`[RecordingService] Chunk recorded: ${event.data.size} bytes`);
        }
      };
      
      this.mediaRecorder.onerror = (event) => {
        console.error('[RecordingService] Recording error:', event);
        this.isRecording = false;
      };
      
      // Request data every second for better reliability
      this.mediaRecorder.start(1000);
      this.isRecording = true;
      
      console.log(`[RecordingService] Recording started (${selectedMimeType})`);
      console.log(`[RecordingService] Stream tracks:`, {
        video: stream.getVideoTracks().length,
        audio: stream.getAudioTracks().length,
      });
    } catch (error) {
      console.error('[RecordingService] Failed to start recording:', error);
      this.isRecording = false;
      throw error;
    }
  }
  
  /**
   * Stop recording and return blob
   */
  async stopRecording(): Promise<Blob | undefined> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecording) {
        console.warn('[RecordingService] No active recording to stop');
        resolve(undefined);
        return;
      }
      
      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'video/webm';
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        const duration = Date.now() - this.recordingStartTime;
        
        this.isRecording = false;
        this.recordedChunks = [];
        
        console.log(`[RecordingService] Recording stopped:`, {
          size: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
          duration: `${(duration / 1000).toFixed(1)}s`,
          chunks: this.recordedChunks.length,
        });
        
        resolve(blob);
      };
      
      this.mediaRecorder.stop();
    });
  }
  
  /**
   * Download recording as file
   */
  downloadRecording(blob: Blob, filename?: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const extension = blob.type.includes('mp4') ? 'mp4' : 'webm';
    const finalFilename = filename || `screen-recording-${timestamp}.${extension}`;
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up after a delay
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    console.log(`[RecordingService] Downloaded: ${finalFilename} (${(blob.size / 1024 / 1024).toFixed(2)} MB)`);
  }
  
  /**
   * Get recording duration in seconds
   */
  getRecordingDuration(): number {
    if (!this.isRecording) return 0;
    return Math.floor((Date.now() - this.recordingStartTime) / 1000);
  }
  
  /**
   * Get current stream being recorded
   */
  getCurrentStream(): MediaStream | undefined {
    return this.currentStream;
  }
  
  /**
   * Check if currently recording
   */
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }
}

// Export singleton instance
export const recordingService = new RecordingService();
export default recordingService;
