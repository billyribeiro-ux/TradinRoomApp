import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';

// Configure test timeout
// jest.setTimeout is not available in Vitest, use vi.setConfig instead
// but for simplicity, we'll rely on Vitest's default timeout

// Configure test environment
configure({
  asyncUtilTimeout: 5000,
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
  addListener: () => { /* noop */ return undefined; },
  removeListener: () => { /* noop */ return undefined; },
  addEventListener: () => { /* noop */ return undefined; },
  removeEventListener: () => { /* noop */ return undefined; },
  dispatchEvent: () => { /* noop */ return false; },
  }),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() { /* noop */ }
  unobserve() { /* noop */ }
  disconnect() { /* noop */ }
};
