// ============================================================================
// COMPOSITOR SERVICE - Ink + Screen Compositing for Recording
// ============================================================================
// Composites whiteboard overlay with screen share for recording output
// ============================================================================

export interface StartParams {
  displayTrack: MediaStreamTrack | null;
  overlayCanvas: HTMLCanvasElement | OffscreenCanvas;
  mode: 'transparent' | 'whiteboard';
  bg?: string | null;
  fps?: number;
}

export class CompositorService {
  private canvas: HTMLCanvasElement | OffscreenCanvas | null = null;
  private ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;
  private video: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private rafId: number | null = null;
  private overlayCanvas: HTMLCanvasElement | OffscreenCanvas | null = null;
  private mode: 'transparent' | 'whiteboard' = 'transparent';
  private bg: string | null = null;
  private fps = 30;
  private lastFrameTime = 0;

  /**
   * Start compositing and return composited MediaStream
   */
  start(params: StartParams): MediaStream {
    if (typeof window === 'undefined') {
      throw new Error('CompositorService requires browser environment');
    }

    this.mode = params.mode;
    this.bg = params.bg ?? null;
    this.fps = params.fps ?? 30;
    this.overlayCanvas = params.overlayCanvas;

    // Create hidden canvas for compositing
    const useOffscreen = typeof OffscreenCanvas !== 'undefined';
    
    if (useOffscreen && params.overlayCanvas instanceof OffscreenCanvas) {
      this.canvas = new OffscreenCanvas(1920, 1080);
      this.ctx = this.canvas.getContext('2d', { alpha: false });
    } else {
      this.canvas = document.createElement('canvas');
      this.canvas.width = 1920;
      this.canvas.height = 1080;
      this.ctx = this.canvas.getContext('2d', { alpha: false });
    }

    if (!this.ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Set up video element for display track if in transparent mode
    if (params.displayTrack && this.mode === 'transparent') {
      this.video = document.createElement('video');
      this.video.srcObject = new MediaStream([params.displayTrack]);
      this.video.autoplay = true;
      this.video.muted = true;
      this.video.playsInline = true;
    }

    // Start capture stream
    if (this.canvas instanceof HTMLCanvasElement) {
      this.stream = this.canvas.captureStream(this.fps);
    } else {
      // OffscreenCanvas doesn't have captureStream, need workaround
      // For now, fall back to regular canvas
      const fallbackCanvas = document.createElement('canvas');
      fallbackCanvas.width = 1920;
      fallbackCanvas.height = 1080;
      this.canvas = fallbackCanvas;
      this.ctx = fallbackCanvas.getContext('2d', { alpha: false });
      this.stream = fallbackCanvas.captureStream(this.fps);
    }

    // Start render loop
    this.startRenderLoop();

    return this.stream;
  }

  /**
   * Switch mode during active compositing
   */
  swapMode(mode: 'transparent' | 'whiteboard', bg?: string | null): void {
    this.mode = mode;
    if (bg !== undefined) {
      this.bg = bg;
    }

    // If switching to transparent and no video exists, create it
    if (mode === 'transparent' && !this.video) {
      // Video will be null - just render overlay
    }
  }

  /**
   * Stop compositing and cleanup
   */
  stop(): void {
    // Stop RAF loop
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    // Stop all tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    // Cleanup video
    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }

    // Cleanup canvas
    this.canvas = null;
    this.ctx = null;
    this.overlayCanvas = null;
  }

  /**
   * Get current composited stream
   */
  getStream(): MediaStream | null {
    return this.stream;
  }

  /**
   * Render loop
   */
  private startRenderLoop(): void {
    const frameInterval = 1000 / this.fps;

    const render = (timestamp: number) => {
      if (!this.ctx || !this.canvas || !this.overlayCanvas) {
        return;
      }

      // Throttle to target FPS
      if (timestamp - this.lastFrameTime < frameInterval) {
        this.rafId = requestAnimationFrame(render);
        return;
      }
      this.lastFrameTime = timestamp;

      const width = this.canvas.width;
      const height = this.canvas.height;

      // Clear canvas
      this.ctx.clearRect(0, 0, width, height);

      // Draw background based on mode
      if (this.mode === 'whiteboard') {
        // Solid background
        this.ctx.fillStyle = this.bg || '#0b0f19';
        this.ctx.fillRect(0, 0, width, height);
      } else if (this.mode === 'transparent' && this.video && this.video.readyState >= 2) {
        // Draw video frame
        try {
          this.ctx.drawImage(this.video, 0, 0, width, height);
        } catch {
          // Video not ready yet
        }
      }

      // Draw overlay canvas (ink)
      try {
        this.ctx.drawImage(this.overlayCanvas as unknown as CanvasImageSource, 0, 0, width, height);
      } catch {
        // Overlay not ready
      }

      // Continue loop
      this.rafId = requestAnimationFrame(render);
    };

    this.rafId = requestAnimationFrame(render);
  }
}

// Singleton instance
let compositorInstance: CompositorService | null = null;

export function getCompositorService(): CompositorService {
  if (!compositorInstance) {
    compositorInstance = new CompositorService();
  }
  return compositorInstance;
}

export function resetCompositorService(): void {
  if (compositorInstance) {
    compositorInstance.stop();
    compositorInstance = null;
  }
}
