import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadThemeJson, parseThemeJson } from '../../src/utils/themeExport';

describe('themeExport', () => {
  describe('downloadThemeJson', () => {
    let createElementSpy: any;
    let createObjectURLSpy: any;
    let revokeObjectURLSpy: any;
    let mockAnchor: any;

    beforeEach(() => {
      mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      };

      createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
      createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
  revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => { /* noop */ return undefined; });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should create blob and trigger download', () => {
      const data = { colors: { primary: '#2563eb' }, motion: { duration: '300ms' } };

      downloadThemeJson('test-theme.json', data);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(mockAnchor.href).toBe('blob:mock-url');
      expect(mockAnchor.download).toBe('test-theme.json');
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should serialize data as formatted JSON', () => {
      const data = { test: 'value' };
      let capturedBlob: Blob | undefined;

      createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
        capturedBlob = blob as Blob;
        return 'blob:mock-url';
      });

      downloadThemeJson('test.json', data);

      expect(capturedBlob).toBeInstanceOf(Blob);
      expect(capturedBlob?.type).toBe('application/json');
    });

    it('should handle complex nested data', () => {
      const data = {
        colors: { primary: '#fff', nested: { deep: 'value' } },
        array: [1, 2, 3],
      };

      expect(() => {
        downloadThemeJson('complex.json', data);
      }).not.toThrow();

      expect(mockAnchor.click).toHaveBeenCalled();
    });
  });

  describe('parseThemeJson', () => {
    it('should parse valid JSON file', async () => {
      const jsonData = { colors: { primary: '#2563eb' } };
      const blob = new Blob([JSON.stringify(jsonData)], { type: 'application/json' });
      const file = new File([blob], 'theme.json', { type: 'application/json' });

      const result = await parseThemeJson(file);

      expect(result).toEqual(jsonData);
    });

    it('should reject invalid JSON', async () => {
      const blob = new Blob(['{ invalid json }'], { type: 'application/json' });
      const file = new File([blob], 'theme.json', { type: 'application/json' });

      await expect(parseThemeJson(file)).rejects.toThrow('Invalid JSON');
    });

    it('should reject empty file', async () => {
      const blob = new Blob([''], { type: 'application/json' });
      const file = new File([blob], 'theme.json', { type: 'application/json' });

      await expect(parseThemeJson(file)).rejects.toThrow('Invalid JSON');
    });

    it('should handle complex nested JSON', async () => {
      const jsonData = {
        colors: { primary: '#fff', nested: { deep: { value: 'test' } } },
        array: [1, 2, { nested: true }],
      };
      const blob = new Blob([JSON.stringify(jsonData)], { type: 'application/json' });
      const file = new File([blob], 'theme.json', { type: 'application/json' });

      const result = await parseThemeJson(file);

      expect(result).toEqual(jsonData);
    });

    it('should handle file read errors gracefully', async () => {
      // Create a mock file that will fail to read
      const mockFile = {
        name: 'test.json',
        type: 'application/json',
      } as File;

      // Mock FileReader to simulate error
      const originalFileReader = globalThis.FileReader;
      globalThis.FileReader = class MockFileReader {
        readAsText() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Event('error'));
            }
          }, 0);
        }
        onerror: ((event: Event) => void) | null = null;
        onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
      } as any;

      await expect(parseThemeJson(mockFile)).rejects.toThrow('Failed to read file');

      globalThis.FileReader = originalFileReader;
    });
  });
});
