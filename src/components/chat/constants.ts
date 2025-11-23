/**
 * Chat Constants & Enums - Microsoft Enterprise Pattern
 * Centralized configuration for chat functionality
 */

// ============================================================================
// SCROLL CONSTANTS
// ============================================================================
export const SCROLL_THRESHOLD_PX = 100;
export const INITIAL_SCROLL_BEHAVIOR = 'instant' as const;
export const SMOOTH_SCROLL_BEHAVIOR = 'smooth' as const;
export const SCROLL_DELAY_MS = 50;

// ============================================================================
// FILE UPLOAD CONSTANTS
// ============================================================================
export const MAX_FILE_SIZE_MB = 10;
export const UPLOAD_CHUNK_SIZE = 1024 * 1024; // 1MB chunks

// ============================================================================
// UI CONSTANTS
// ============================================================================
export const AVATAR_SIZE_PX = 32;
export const DEBOUNCE_DELAY_MS = 300;
export const MAX_MESSAGE_LENGTH = 5000;
export const MAX_PINNED_MESSAGES = 5;

// ============================================================================
// ENUMS
// ============================================================================
export enum MessageType {
  Text = 'text',
  Image = 'image',
  File = 'file'
}

export enum UserRoleType {
  Admin = 'admin',
  Host = 'host',
  Moderator = 'moderator',
  Member = 'member',
  Guest = 'guest'
}

export enum LoadingState {
  Idle = 'idle',
  Loading = 'loading',
  Success = 'success',
  Error = 'error'
}
