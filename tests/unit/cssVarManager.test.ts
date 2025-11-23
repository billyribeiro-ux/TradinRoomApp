import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { applyCssVars } from '../../src/utils/cssVarManager';

describe('cssVarManager', () => {
  describe('applyCssVars', () => {
    let originalWindow: typeof globalThis.window;
    let originalDocument: typeof globalThis.document;

    beforeEach(() => {
      originalWindow = globalThis.window;
      originalDocument = globalThis.document;
    });

    afterEach(() => {
      // Restore originals
      if (!originalWindow) {
        delete (globalThis as any).window;
      }
      if (!originalDocument) {
        delete (globalThis as any).document;
      }
    });

    it('should set CSS variables on document root', () => {
      const setPropertyMock = vi.fn();
      
      // Ensure window exists for SSR guard
      if (!globalThis.window) {
        (globalThis as any).window = {};
      }
      
      globalThis.document = {
        documentElement: {
          style: {
            setProperty: setPropertyMock,
          },
        },
      } as any;

      applyCssVars({
        '--theme-primary': '#2563eb',
        '--theme-font': 'Inter',
      });

      expect(setPropertyMock).toHaveBeenCalledWith('--theme-primary', '#2563eb');
      expect(setPropertyMock).toHaveBeenCalledWith('--theme-font', 'Inter');
      expect(setPropertyMock).toHaveBeenCalledTimes(2);
    });

    it('should handle empty vars object', () => {
      const setPropertyMock = vi.fn();
      
      if (!globalThis.window) {
        (globalThis as any).window = {};
      }
      
      globalThis.document = {
        documentElement: {
          style: {
            setProperty: setPropertyMock,
          },
        },
      } as any;

      applyCssVars({});

      expect(setPropertyMock).not.toHaveBeenCalled();
    });

    it('should be SSR-safe when window is undefined', () => {
      delete (globalThis as any).window;

      // Should not throw
      expect(() => {
        applyCssVars({
          '--theme-primary': '#2563eb',
        });
      }).not.toThrow();
    });

    it('should be SSR-safe when document is undefined', () => {
      delete (globalThis as any).document;

      // Should not throw
      expect(() => {
        applyCssVars({
          '--theme-primary': '#2563eb',
        });
      }).not.toThrow();
    });

    it('should handle multiple variables in one call', () => {
      const setPropertyMock = vi.fn();
      
      if (!globalThis.window) {
        (globalThis as any).window = {};
      }
      
      globalThis.document = {
        documentElement: {
          style: {
            setProperty: setPropertyMock,
          },
        },
      } as any;

      applyCssVars({
        '--color-1': 'red',
        '--color-2': 'blue',
        '--color-3': 'green',
        '--size': '16px',
      });

      expect(setPropertyMock).toHaveBeenCalledTimes(4);
    });

    it('should handle special characters in variable names', () => {
      const setPropertyMock = vi.fn();
      
      if (!globalThis.window) {
        (globalThis as any).window = {};
      }
      
      globalThis.document = {
        documentElement: {
          style: {
            setProperty: setPropertyMock,
          },
        },
      } as any;

      applyCssVars({
        '--theme-primary-color': '#2563eb',
        '--font_family': 'Inter',
      });

      expect(setPropertyMock).toHaveBeenCalledWith('--theme-primary-color', '#2563eb');
      expect(setPropertyMock).toHaveBeenCalledWith('--font_family', 'Inter');
    });
  });
});
