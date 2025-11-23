/**
 * Trading Room Constants - Microsoft Enterprise Standards
 * =========================================================
 * Centralized constants for trading room functionality
 */

// ============================================================================
// DEVICE DETECTION
// ============================================================================

export const DEVICE_BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  LARGE_DESKTOP: 2560,
  ULTRAWIDE_RATIO: 2,
} as const;

export type DeviceType = 'MOBILE' | 'TABLET' | 'DESKTOP' | 'LARGE_DESKTOP' | 'ULTRAWIDE' | 'SSR';

// ============================================================================
// PANEL SIZING
// ============================================================================

export const PANEL_CONSTRAINTS = {
  SIDEBAR_MIN_WIDTH: 280,
  SIDEBAR_MAX_WIDTH: 600,
  SIDEBAR_DEFAULT_WIDTH: 350,
  
  ALERT_MIN_HEIGHT: 120,
  ALERT_MAX_HEIGHT_PERCENT: 60,
  ALERT_DEFAULT_HEIGHT: 300,
  
  CHAT_MIN_HEIGHT: 200,
} as const;

// ============================================================================
// MEDIA CONSTRAINTS
// ============================================================================

export const MEDIA_CONSTRAINTS = {
  AUDIO: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  VIDEO: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
  },
  SCREEN_SHARE: {
    video: {
      cursor: 'always' as const,
      displaySurface: 'monitor' as const,
    },
    audio: false,
  },
} as const;

// ============================================================================
// TIMING & RETRY
// ============================================================================

export const TIMING = {
  DEBOUNCE_RESIZE: 100,
  THROTTLE_PRESENCE: 5000,
  RETRY_DELAY_MS: 1000,
  MAX_RETRIES: 3,
  RECONNECT_DELAY_MS: 2000,
  CLEANUP_DELAY_MS: 500,
} as const;

// ============================================================================
// HOTKEYS
// ============================================================================

export const HOTKEYS = {
  TOGGLE_MIC: 'm',
  TOGGLE_CAMERA: 'v',
  TOGGLE_SCREEN_SHARE: 's',
  TOGGLE_RECORDING: 'r',
  OPEN_SETTINGS: ',',
} as const;

// ============================================================================
// PERMISSIONS
// ============================================================================

export const PERMISSIONS = {
  MANAGE_ROOM: 'manage_room',
  DELETE_CONTENT: 'delete_content',
  RECORD_SESSION: 'record_session',
  SHARE_SCREEN: 'share_screen',
  MUTE_USERS: 'mute_users',
  BAN_USERS: 'ban_users',
} as const;

// ============================================================================
// ERROR CODES
// ============================================================================

export const ERROR_CODES = {
  ROOM_JOIN_FAILED: 'ROOM_JOIN_FAILED',
  MEDIA_PERMISSION_DENIED: 'MEDIA_PERMISSION_DENIED',
  DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',
  SCREEN_SHARE_FAILED: 'SCREEN_SHARE_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// ============================================================================
// TELEMETRY EVENTS
// ============================================================================

export const TELEMETRY_EVENTS = {
  ROOM_JOIN_START: 'room_join_start',
  ROOM_JOIN_COMPLETE: 'room_join_complete',
  FIRST_FRAME_RENDERED: 'first_frame_rendered',
  SCREEN_SHARE_START: 'screen_share_start',
  SCREEN_SHARE_STOP: 'screen_share_stop',
  DEVICE_SWITCH: 'device_switch',
  MESSAGE_SENT: 'message_sent',
  ALERT_POSTED: 'alert_posted',
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getBaselineDimensions() {
  if (typeof window === 'undefined') {
    return { width: 1920, height: 1080, device: 'SSR' as DeviceType };
  }
  
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspectRatio = width / height;
  
  let device: DeviceType = 'DESKTOP';
  if (width <= DEVICE_BREAKPOINTS.MOBILE) {
    device = 'MOBILE';
  } else if (width <= DEVICE_BREAKPOINTS.TABLET) {
    device = 'TABLET';
  } else if (width >= DEVICE_BREAKPOINTS.LARGE_DESKTOP) {
    device = 'LARGE_DESKTOP';
  } else if (aspectRatio > DEVICE_BREAKPOINTS.ULTRAWIDE_RATIO) {
    device = 'ULTRAWIDE';
  }
  
  return { width, height, device };
}

// ============================================================================
// CSS VARIABLES
// ============================================================================

export const BASE_CSS_VARS = {
  verticalResizerWidth: 14,  // px
  alertHeaderHeight: 50,     // px
  alertItemHeight: 60,       // px
} as const;
