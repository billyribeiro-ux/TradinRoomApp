/**
 * E2E Test Fixtures
 * Microsoft Enterprise Pattern - Media Stubs & Helpers
 */

import type { Page } from '@playwright/test';
import { test as base } from '@playwright/test';

interface TradingRoomFixtures {
  gotoTradingRoom: () => Promise<void>;
  stubMediaDevices: () => Promise<void>;
}

/**
 * Stub getUserMedia and getDisplayMedia for fake media streams
 */
async function setupMediaStubs(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Stub getUserMedia for audio/video
    navigator.mediaDevices.getUserMedia = async (constraints) => {
      console.log('[E2E] getUserMedia called with:', constraints);
      
      // Create fake media stream
      const stream = new MediaStream();
      
      if (constraints?.audio) {
        // Create fake audio track
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const dest = audioContext.createMediaStreamDestination();
        oscillator.connect(dest);
        oscillator.start();
        stream.addTrack(dest.stream.getAudioTracks()[0]);
      }
      
      if (constraints?.video) {
        // Create fake video track using canvas
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#00FF00';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        const canvasStream = canvas.captureStream(30);
        stream.addTrack(canvasStream.getVideoTracks()[0]);
      }
      
      return stream;
    };

    // Stub getDisplayMedia for screenshare
    if (navigator.mediaDevices.getDisplayMedia) {
      navigator.mediaDevices.getDisplayMedia = async (constraints) => {
        console.log('[E2E] getDisplayMedia called with:', constraints);
        
        // Create fake screenshare stream
        const canvas = document.createElement('canvas');
        canvas.width = 1920;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0000FF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '48px Arial';
          ctx.fillText('Fake Screen Share', 50, 100);
        }
        const stream = canvas.captureStream(30);
        
        // Add stop handler
        stream.getVideoTracks()[0].addEventListener('ended', () => {
          console.log('[E2E] Screen share track ended');
        });
        
        return stream;
      };
    }

    // Stub enumerateDevices
    navigator.mediaDevices.enumerateDevices = async () => {
      return [
        {
          deviceId: 'fake-audio-input',
          groupId: 'fake-group-1',
          kind: 'audioinput' as MediaDeviceKind,
          label: 'Fake Microphone',
          toJSON: () => ({}),
        },
        {
          deviceId: 'fake-video-input',
          groupId: 'fake-group-2',
          kind: 'videoinput' as MediaDeviceKind,
          label: 'Fake Camera',
          toJSON: () => ({}),
        },
        {
          deviceId: 'fake-audio-output',
          groupId: 'fake-group-3',
          kind: 'audiooutput' as MediaDeviceKind,
          label: 'Fake Speaker',
          toJSON: () => ({}),
        },
      ];
    };
  });
}

/**
 * Extended test with custom fixtures
 */
export const test = base.extend<TradingRoomFixtures>({
  stubMediaDevices: async ({ page }, use) => {
    await setupMediaStubs(page);
    await use(async () => {
      // No-op, stubs are already set up
    });
  },

  gotoTradingRoom: async ({ page, stubMediaDevices }, use) => {
    await use(async () => {
      // Setup media stubs first
      await stubMediaDevices();
      // Navigate directly to deterministic test trading route (session injected by app)
      await page.goto('/__test_trading/test-room');
      // Avoid waiting for full networkidle because 3rd party iframes (e.g. Spotify) can
      // keep the network busy in Firefox/WebKit causing timeouts. The shell route is
      // deterministic; just wait for DOMContentLoaded and the root selector.
      await page.waitForLoadState('domcontentloaded');
      // Wait for trading room root selector
      try {
        await page.waitForSelector('[data-trading-room]', { timeout: 15000 });
        console.log('[E2E] Test trading room loaded successfully');
      } catch (error) {
        console.error('[E2E] Test trading room failed to load:', error);
        throw error;
      }
    });
  },
});

export { expect } from '@playwright/test';
