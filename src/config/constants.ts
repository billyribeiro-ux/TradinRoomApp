/**
 * Application Constants
 * Created: Emergency production unblock
 */

// API Configuration
export const API_CONFIG = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  LIVEKIT_URL: import.meta.env.VITE_LIVEKIT_URL,
} as const;

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'Trading Room',
  APP_URL: import.meta.env.VITE_APP_URL || 'https://tradingroom.app',
  VERSION: '1.0.0',
} as const;

// Room Configuration
export const ROOM_CONFIG = {
  MAX_PARTICIPANTS: 100,
  DEFAULT_RECORDING_FORMAT: 'mp4',
  SCREEN_SHARE_FPS: 30,
  VIDEO_CONSTRAINTS: {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 30 },
  },
  AUDIO_CONSTRAINTS: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
} as const;

// Theme Configuration
export const THEME_CONFIG = {
  DEFAULT_THEME: 'dark',
  STORAGE_KEY: 'tradingroom-theme',
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  TRADER: 'trader',
  MEMBER: 'member',
} as const;

// File Upload Configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  STORAGE_BUCKET: 'avatars',
} as const;

// Export all as default for convenience
export default {
  API_CONFIG,
  APP_CONFIG,
  ROOM_CONFIG,
  THEME_CONFIG,
  USER_ROLES,
  UPLOAD_CONFIG,
};

// Missing exports for TradingRoom compatibility
export const SPOTIFY_SCOPES = new Set([
  'user-read-private',
  'user-read-email',
  'playlist-read-private',
  'playlist-read-collaborative'
]);

export const LINKEDIN_SCOPES = new Set([
  'r_liteprofile',
  'r_emailaddress'
]);

export const API_ENDPOINTS = {
  spotify: {
    authorize: 'https://accounts.spotify.com/authorize'
  },
  linkedin: {
    authorize: 'https://www.linkedin.com/oauth/v2/authorization'
  }
};

export const STORAGE_BUCKETS = {
  avatars: 'avatars',
  files: 'files',
  recordings: 'recordings',
  branding: 'branding',
  chatUploads: 'files'
};

export const LIMITS = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxAvatarSize: 2 * 1024 * 1024,  // 2MB
  maxAttachmentSize: 10 * 1024 * 1024, // 10MB
  maxRecordingDuration: 60 * 60 * 1000 // 1 hour
};

export const DB_TABLES = {
  users: 'users',
  rooms: 'rooms',
  alerts: 'alerts',
  chatmessages: 'chatmessages',
  chatMessages: 'chatmessages'
};

export const TIMING = {
  heartbeatInterval: 30000,
  cleanupInterval: 60000,
  reconnectDelay: 5000
};
