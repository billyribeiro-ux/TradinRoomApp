import { describe, it, expect, vi } from 'vitest';
import { uploadPublicAsset } from '../../src/services/storageService';

describe('storageService', () => {
  describe('uploadPublicAsset', () => {
    it('should return url on successful upload', async () => {
      const mockSupabase = {
        storage: {
          from: vi.fn(() => ({
            upload: vi.fn().mockResolvedValue({ error: null }),
            getPublicUrl: vi.fn(() => ({
              data: { publicUrl: 'https://example.com/file.png' },
            })),
          })),
        },
      };

      const file = new File(['content'], 'test.png', { type: 'image/png' });
      const result = await uploadPublicAsset({
        supabase: mockSupabase as any,
        bucket: 'branding',
        path: 'test/file.png',
        file,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.url).toBe('https://example.com/file.png');
      }
    });

    it('should return error on upload failure', async () => {
      const mockSupabase = {
        storage: {
          from: vi.fn(() => ({
            upload: vi.fn().mockResolvedValue({
              error: { message: 'Storage quota exceeded' },
            }),
          })),
        },
      };

      const file = new File(['content'], 'test.png', { type: 'image/png' });
      const result = await uploadPublicAsset({
        supabase: mockSupabase as any,
        bucket: 'branding',
        path: 'test/file.png',
        file,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Storage quota exceeded');
      }
    });

    it('should return error when publicUrl is missing', async () => {
      const mockSupabase = {
        storage: {
          from: vi.fn(() => ({
            upload: vi.fn().mockResolvedValue({ error: null }),
            getPublicUrl: vi.fn(() => ({
              data: { publicUrl: null },
            })),
          })),
        },
      };

      const file = new File(['content'], 'test.png', { type: 'image/png' });
      const result = await uploadPublicAsset({
        supabase: mockSupabase as any,
        bucket: 'branding',
        path: 'test/file.png',
        file,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Failed to retrieve public URL');
      }
    });

    it('should handle upsert parameter', async () => {
      const uploadMock = vi.fn().mockResolvedValue({ error: null });
      const mockSupabase = {
        storage: {
          from: vi.fn(() => ({
            upload: uploadMock,
            getPublicUrl: vi.fn(() => ({
              data: { publicUrl: 'https://example.com/file.png' },
            })),
          })),
        },
      };

      const file = new File(['content'], 'test.png', { type: 'image/png' });
      await uploadPublicAsset({
        supabase: mockSupabase as any,
        bucket: 'branding',
        path: 'test/file.png',
        file,
        upsert: true,
      });

      expect(uploadMock).toHaveBeenCalledWith(
        'test/file.png',
        file,
        { upsert: true }
      );
    });

    it('should catch and return unexpected errors', async () => {
      const mockSupabase = {
        storage: {
          from: vi.fn(() => ({
            upload: vi.fn().mockRejectedValue(new Error('Network error')),
          })),
        },
      };

      const file = new File(['content'], 'test.png', { type: 'image/png' });
      const result = await uploadPublicAsset({
        supabase: mockSupabase as any,
        bucket: 'branding',
        path: 'test/file.png',
        file,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Network error');
      }
    });
  });
});
