/** Central registry of data-testid selectors (read-only) */

export const TEST_IDS = {
  // Auth
  LOGIN_FORM: 'login-form',
  EMAIL_INPUT: 'email-input',
  PASSWORD_INPUT: 'password-input',
  LOGIN_BUTTON: 'login-button',
  
  // Navigation
  BRAND_HEADER: 'brand-header',
  LEFT_PANEL: 'left-panel',
  CONTENT_AREA: 'content-area',
  
  // Tabs
  SCREENS_TAB: 'screens-tab',
  NOTES_TAB: 'notes-tab',
  FILES_TAB: 'files-tab',
  
  // Resizers
  VERTICAL_RESIZER: 'vertical-resizer',
  HORIZONTAL_RESIZER: 'horizontal-resizer',
  
  // Modals
  ALERT_MODAL: 'alert-modal',
  BRANDING_MODAL: 'branding-modal',
  CAMERA_WINDOW: 'camera-window',
  WHITEBOARD_OVERLAY: 'whiteboard-overlay',
  
  // Panels
  ALERTS_PANEL: 'alerts-panel',
  CHAT_PANEL: 'chat-panel',
} as const;

export type TestId = typeof TEST_IDS[keyof typeof TEST_IDS];
