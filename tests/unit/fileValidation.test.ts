import { describe, it, expect } from 'vitest';
import { validateImageFile } from '../../src/utils/fileValidation';

describe('fileValidation', () => {
  describe('validateImageFile', () => {
    const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'] as const;
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB

    it('should accept valid PNG file', () => {
      const file = new File(['content'], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 1024 });

      const result = validateImageFile(file, ALLOWED_TYPES, MAX_SIZE);

      expect(result.ok).toBe(true);
    });

    it('should accept valid JPEG file', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 });

      const result = validateImageFile(file, ALLOWED_TYPES, MAX_SIZE);

      expect(result.ok).toBe(true);
    });

    it('should reject disallowed MIME type', () => {
      const file = new File(['content'], 'test.svg', { type: 'image/svg+xml' });
      Object.defineProperty(file, 'size', { value: 1024 });

      const result = validateImageFile(file, ALLOWED_TYPES, MAX_SIZE);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toContain('Invalid file type');
        expect(result.reason).toContain('image/png');
      }
    });

    it('should reject file exceeding size limit', () => {
      const file = new File(['content'], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 3 * 1024 * 1024 }); // 3MB

      const result = validateImageFile(file, ALLOWED_TYPES, MAX_SIZE);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toContain('File too large');
        expect(result.reason).toContain('2.0MB');
      }
    });

    it('should accept file at exact size limit', () => {
      const file = new File(['content'], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: MAX_SIZE });

      const result = validateImageFile(file, ALLOWED_TYPES, MAX_SIZE);

      expect(result.ok).toBe(true);
    });

    it('should reject file one byte over limit', () => {
      const file = new File(['content'], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: MAX_SIZE + 1 });

      const result = validateImageFile(file, ALLOWED_TYPES, MAX_SIZE);

      expect(result.ok).toBe(false);
    });

    it('should handle empty allowed types array', () => {
      const file = new File(['content'], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 1024 });

      const result = validateImageFile(file, [], MAX_SIZE);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toContain('Invalid file type');
      }
    });

    it('should handle zero-byte file', () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 0 });

      const result = validateImageFile(file, ALLOWED_TYPES, MAX_SIZE);

      expect(result.ok).toBe(true);
    });
  });
});
