/**
 * Chat Utility Functions - Microsoft Enterprise Pattern
 * Reusable helper functions for chat functionality
 */

import type { ChatMessage, Database } from '../../types/database.types';

import { MAX_FILE_SIZE_MB, UPLOAD_CHUNK_SIZE } from './constants';

type UserRow = Database['public']['Tables']['users']['Row'];

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
export interface MessageAuthor {
  id: string;
  display_name?: string;
  email?: string;
  avatar_url?: string;
}

// ============================================================================
// FILE TYPE GUARDS
// ============================================================================
export const isImageUrl = (url: string): boolean => {
  try {
    const withoutQuery = url.split('?')[0];
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(withoutQuery);
  } catch {
    return false;
  }
};

export const isPdfUrl = (url: string): boolean => {
  try {
    const withoutQuery = url.split('?')[0];
    return /\.pdf$/i.test(withoutQuery);
  } catch {
    return false;
  }
};

export const isValidFileType = (file: File): boolean => {
  const allowedTypes = [
    'image/',
    'application/pdf',
    'text/',
    'application/msword',
    'application/vnd.openxmlformats-officedocument'
  ];
  return allowedTypes.some(type => file.type.startsWith(type));
};

// ============================================================================
// FILE VALIDATION
// ============================================================================
export const isValidFileSize = (file: File): { valid: boolean; error?: string } => {
  const maxSizeBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE_MB}MB`
    };
  }
  return { valid: true };
};

/**
 * Compress image for optimal upload performance
 * Microsoft L65 Pattern: Quality-optimized compression
 * Target: <500KB for fast uploads, maintains visual quality
 */
export const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if too large (Microsoft optimization: max 1920px)
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1920;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with quality optimization
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          0.85 // 85% quality - optimal balance
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};

export const prepareChunkedUpload = (file: File): { chunks: number; chunkSize: number } => {
  const chunks = Math.ceil(file.size / UPLOAD_CHUNK_SIZE);
  return {
    chunks,
    chunkSize: UPLOAD_CHUNK_SIZE
  };
};

// ============================================================================
// MESSAGE HELPERS
// ============================================================================
export const getMessageAuthor = (message: ChatMessage & { user?: UserRow }): MessageAuthor => {
  if (message?.user && typeof message.user === 'object') {
    return {
      id: message.user.id || message.user_id,
      display_name: message.user.display_name ?? undefined,
      email: message.user.email,
      avatar_url: message.user.avatar_url ?? undefined
    };
  }
  return {
    id: message?.user_id || 'unknown',
    display_name: undefined
  };
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Generic debounce requires any for flexibility
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};
