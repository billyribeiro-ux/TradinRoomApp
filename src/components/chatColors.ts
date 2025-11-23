/**
 * Chat Panel Color System - Microsoft Enterprise Pattern
 * Centralized color definitions for Chat panel theming
 * Customize these colors to change the entire Chat UI
 */

export const CHAT_COLORS = {
  // Header Colors
  header: {
    background: '#3B82F6',        // Chat header background
    icon: '#ffffff',              // Chat bubble icon color
    text: '#ffffff',              // Header text color
    border: '#6C99C8',           // Header border color
    underline: '#40E0D0',        // Cyan underline color
    activeTab: '#46A2FF',        // Active tab background
  },

  // Message/Alert Card Colors
  cards: {
    background: '#334155',          // Card background (slate-700)
    backgroundAlt: '#1e293b',       // Alternate background (slate-800)
    hover: '#475569',               // Hover state (slate-600/50)
    border: '#475569',              // Card border (slate-600)
    ownMessage: {
      background: 'rgba(30, 58, 138, 0.2)',  // Own message background (blue-900/20)
      hover: 'rgba(30, 58, 138, 0.3)',       // Own message hover (blue-900/30)
    },
  },

  // Text Colors
  text: {
    primary: '#ffffff',             // Primary text (white)
    secondary: '#94a3b8',           // Secondary text (slate-400)
    content: '#e2e8f0',             // Message content (slate-200)
    placeholder: '#94a3b8',         // Placeholder text (slate-400)
    link: '#60a5fa',                // Link color (blue-400)
    linkHover: '#93c5fd',           // Link hover (blue-300)
  },

  // Role-based Colors
  roles: {
    admin: {
      background: '#dc2626',        // Admin badge background (red-600)
      text: '#ffffff',              // Admin text color
      ring: '#dc2626',              // Admin ring color
    },
    moderator: {
      background: '#16a34a',        // Moderator badge background (green-600)
      text: '#ffffff',              // Moderator text color
      ring: '#16a34a',              // Moderator ring color
    },
    member: {
      background: '#2563eb',        // Member badge background (blue-600)
      text: '#ffffff',              // Member text color
      ring: '#2563eb',              // Member ring color
    },
    guest: {
      background: '#64748b',        // Guest badge background (slate-500)
      text: '#ffffff',              // Guest text color
      ring: '#64748b',              // Guest ring color
    },
  },

  // Input Colors
  input: {
    background: '#1e293b',          // Input background (slate-800)
    border: '#475569',              // Input border (slate-600)
    focusRing: '#3b82f6',           // Focus ring color (blue-500)
  },

  // Button Colors
  buttons: {
    primary: {
      background: '#2563eb',        // Primary button (blue-600)
      hover: '#1d4ed8',             // Primary hover (blue-700)
      text: '#ffffff',              // Button text
    },
    secondary: {
      background: '#475569',        // Secondary button (slate-600)
      hover: '#64748b',             // Secondary hover (slate-500)
      text: '#ffffff',              // Button text
    },
    danger: {
      background: '#dc2626',        // Danger button (red-600)
      hover: '#b91c1c',             // Danger hover (red-700)
      text: '#ffffff',              // Button text
    },
  },

  // Accent Colors
  accents: {
    unread: '#ef4444',              // Unread indicator (red-500)
    speaking: '#22c55e',            // Speaking indicator (green-500)
    pinned: '#eab308',              // Pinned message (yellow-500)
    online: '#22c55e',              // Online status (green-500)
    offline: '#64748b',             // Offline status (slate-500)
  },

  // Container Colors
  container: {
    background: '#1e293b',          // Main container (slate-800)
    border: '#334155',              // Container border (slate-700)
    divider: '#475569',             // Divider color (slate-600)
  },
};
