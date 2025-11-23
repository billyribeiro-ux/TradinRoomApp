/**
 * Chat Color Configuration - Microsoft Enterprise Pattern
 * Centralized color management for user roles and chat elements
 */

import type { RoleStyle } from '../../features/chat/chat.types';
import { UserRoleType } from './constants';

// ============================================================================
// ROLE COLOR CONFIGURATION
// ============================================================================
export const CHAT_ROLE_COLORS: Record<UserRoleType, RoleStyle> = {
  [UserRoleType.Admin]: {
    textColor: 'text-blue-400',
    bgColor: 'bg-blue-600',
    ringClass: 'ring-2 ring-blue-500',
    badge: 'ADMIN'
  },
  [UserRoleType.Host]: {
    textColor: 'text-purple-400',
    bgColor: 'bg-purple-600',
    ringClass: 'ring-2 ring-purple-500',
    badge: 'HOST'
  },
  [UserRoleType.Moderator]: {
    textColor: 'text-green-400',
    bgColor: 'bg-green-600',
    ringClass: 'ring-2 ring-green-500',
    badge: 'MOD'
  },
  [UserRoleType.Member]: {
    textColor: 'text-slate-300',
    bgColor: 'bg-slate-600',
    ringClass: '',
    badge: undefined
  },
  [UserRoleType.Guest]: {
    textColor: 'text-gray-400',
    bgColor: 'bg-gray-600',
    ringClass: '',
    badge: undefined
  }
};

// ============================================================================
// CHAT THEME COLORS
// ============================================================================
export const CHAT_THEME = {
  // Header colors
  headerPrimary: '#4477AA',
  headerBorder: '#6C99C8',
  headerText: 'white',
  
  // Message background colors
  ownMessageBg: 'bg-blue-900/20',
  ownMessageHover: 'hover:bg-blue-900/30',
  otherMessageBg: 'bg-slate-700/30',
  otherMessageHover: 'hover:bg-slate-700/50',
  
  // UI element colors
  pinnedRing: 'ring-2 ring-blue-500/50',
  unreadBadge: 'bg-orange-500',
  activeTabBg: '#73A0D6',
  
  // Text colors
  primaryText: 'text-slate-200',
  secondaryText: 'text-slate-400',
  timestampText: 'text-slate-400'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
export const getRoleColorStyle = (role?: string): RoleStyle => {
  const roleType = (role as UserRoleType) || UserRoleType.Member;
  return CHAT_ROLE_COLORS[roleType] || CHAT_ROLE_COLORS[UserRoleType.Member];
};

// Export individual color getters for easy access
export const getAdminColors = (): RoleStyle => CHAT_ROLE_COLORS[UserRoleType.Admin];
export const getHostColors = (): RoleStyle => CHAT_ROLE_COLORS[UserRoleType.Host];
export const getModeratorColors = (): RoleStyle => CHAT_ROLE_COLORS[UserRoleType.Moderator];
export const getMemberColors = (): RoleStyle => CHAT_ROLE_COLORS[UserRoleType.Member];
export const getGuestColors = (): RoleStyle => CHAT_ROLE_COLORS[UserRoleType.Guest];