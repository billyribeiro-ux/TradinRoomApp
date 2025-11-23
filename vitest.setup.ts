import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Basic globals/mocks
Object.defineProperty(global, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    media: query,
    matches: false,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Media devices mock
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn(async () => new MediaStream()),
  },
});

// AudioContext mock
class FakeAudioContext {
  public state: 'running' | 'suspended' | 'closed' = 'running';
  async close() { this.state = 'closed'; }
}
(global as any).AudioContext = FakeAudioContext as any;

// MediaStream + Track polyfills (jsdom lacks them)
class FakeMediaStreamTrack {
  enabled = true;
  stop() {}
}
class FakeMediaStream {
  private tracks: FakeMediaStreamTrack[] = [new FakeMediaStreamTrack()];
  getTracks() { return this.tracks; }
  getAudioTracks() { return this.tracks; }
  getVideoTracks() { return this.tracks; }
  addTrack(_t: FakeMediaStreamTrack) { this.tracks.push(_t); }
}
;(global as any).MediaStream = (global as any).MediaStream || (FakeMediaStream as any);

// ResizeObserver polyfill for layout effects
if (!(global as any).ResizeObserver) {
  class FakeResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  ;(global as any).ResizeObserver = FakeResizeObserver as any;
}

// scrollIntoView polyfill used by ChatPanel
if (!Element.prototype.scrollIntoView) {
  // @ts-expect-error test env shim
  Element.prototype.scrollIntoView = function () {};
}

// MediaRecorder polyfill
if (!(global as any).MediaRecorder) {
  class FakeMediaRecorder {
    ondataavailable: ((e: any) => void) | null = null;
    onstop: (() => void) | null = null;
    constructor(_stream: MediaStream, _opts?: any) {}
    static isTypeSupported(_type: string) { return true; }
    start() {}
    stop() {
      if (this.ondataavailable) {
        const blob = new Blob([], { type: 'video/webm' });
        this.ondataavailable({ data: blob });
      }
      if (this.onstop) this.onstop();
    }
  }
  ;(global as any).MediaRecorder = FakeMediaRecorder as any;
}
