/**
 * Unified Panel Color System - Microsoft Enterprise Pattern
 * Centralized color definitions for consistent theming across panels
 */

// ============================================
// ALERTS & CHAT COLOR CUSTOMIZATION SYSTEM
// ============================================
// Change any color here to customize the entire UI

export const COLOR_THEME = {
  // Header Colors
  header: {
    alerts: {
      background: '#3B82F6',        // Alerts header background (matches chat)
      icon: '#ffffff',              // Bell icon color
      text: '#ffffff',              // Header text color
      border: '#6C99C8',           // Header border color (matches chat)
    },
    chat: {
      background: '#3B82F6',        // Chat header background
      icon: '#ffffff',              // Chat bubble icon color
      text: '#ffffff',              // Header text color
      border: '#6C99C8',           // Header border color
      underline: '#40E0D0',        // Cyan underline color
      activeTab: '#46A2FF',        // Active tab background
    },
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

// ============================================
// LEGACY PANEL COLOR SCHEME (for backwards compatibility)
// ============================================

export interface PanelColorScheme {
  // Container colors
  container: {
    background: string;        // Main background (bg-slate-800)
    border: string;            // General borders (border-slate-700)
    divider: string;           // Dividers (border-slate-600)
  };

  // Message/Alert card colors
  card: {
    background: string;        // Card background (bg-slate-700)
    backgroundAlt: string;     // Alternate background (bg-slate-800)
    hover: string;             // Hover state (hover:bg-slate-700/50)
    border: string;            // Card border (border-slate-600)
    own: {
      background: string;      // Own message background (bg-blue-900/20)
      hover: string;           // Own message hover (hover:bg-blue-900/30)
    };
  };

  // Text colors
  text: {
    primary: string;           // Primary text (text-white, text-slate-200)
    secondary: string;         // Secondary text (text-slate-400)
    content: string;           // Content text (text-slate-200 text-sm font-medium)
    placeholder: string;       // Placeholder text (placeholder-slate-400)
    link: {
      normal: string;          // Link color (text-blue-400)
      hover: string;           // Link hover (hover:text-blue-300)
    };
  };

  // Input colors
  input: {
    background: string;        // Input background (bg-slate-800, bg-slate-900)
    border: string;            // Input border (border-slate-600)
    focus: {
      ring: string;            // Focus ring (focus:ring-blue-500)
    };
  };

  // Button colors
  buttons: {
    primary: {
      background: string;      // Primary button (bg-blue-600)
      hover: string;           // Primary hover (hover:bg-blue-700)
    };
    secondary: {
      background: string;      // Secondary button (bg-slate-600)
      hover: string;           // Secondary hover (hover:bg-slate-500)
    };
    danger: {
      background: string;      // Danger button (bg-red-600)
      hover: string;           // Danger hover (hover:bg-red-700)
    };
  };

  // Status/accent colors
  accents: {
    pinned: string;            // Pinned indicator (ring-blue-500/50)
    unread: string;            // Unread badge (bg-blue-500)
    speaking: string;          // Speaking indicator (bg-green-400)
    success: string;           // Success color (text-green-400)
  };
}

// ============================================================================
// DEFAULT COLOR SCHEME - EASY TO CUSTOMIZE!
// ============================================================================
export const PANEL_COLORS: PanelColorScheme = {
  container: {
    background: 'bg-slate-800',
    border: 'border-slate-700',
    divider: 'border-slate-600',
  },

  card: {
    background: 'bg-slate-700',
    backgroundAlt: 'bg-slate-800',
    hover: 'hover:bg-slate-600/50',
    border: 'border-slate-600',
    own: {
      background: 'bg-blue-900/20',
      hover: 'hover:bg-blue-900/30',
    },
  },

  text: {
    primary: 'text-white',
    secondary: 'text-slate-400',
    content: 'text-slate-200 text-sm font-medium',
    placeholder: 'placeholder-slate-400',
    link: {
      normal: 'text-blue-400',
      hover: 'hover:text-blue-300',
    },
  },

  input: {
    background: 'bg-slate-800',
    border: 'border-slate-600',
    focus: {
      ring: 'focus:ring-blue-500',
    },
  },

  buttons: {
    primary: {
      background: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
    },
    secondary: {
      background: 'bg-slate-600',
      hover: 'hover:bg-slate-500',
    },
    danger: {
      background: 'bg-red-600',
      hover: 'hover:bg-red-700',
    },
  },

  accents: {
    pinned: 'ring-2 ring-blue-500/50',
    unread: 'bg-blue-500',
    speaking: 'bg-green-400',
    success: 'text-green-400',
  },
};

// ============================================================================
// USAGE: Import and use anywhere in Chat or Alerts!
// import { PANEL_COLORS } from '../panelColors';
// className={PANEL_COLORS.container.background}
// ============================================================================