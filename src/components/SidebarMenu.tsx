/**
 * SidebarMenu Component - Microsoft Enterprise Pattern
 * Standalone, independent sidebar menu for quick settings and navigation
 * 
 * Created: 2025-11-01
 * Purpose: Extracted from BrandHeader for easier maintenance and development
 */

import {
  Archive,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  MoreVertical,
  Search,
  Settings as SettingsIcon,
  Shuffle,
  Star,
  Users,
  VolumeX,
  Wifi,
} from 'lucide-react';
import { useEffect, useRef } from 'react';

// ============================================================================
// TYPE DEFINITIONS - Microsoft Enterprise Standards
// ============================================================================
interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
  participantCount: number;
  businessName?: string;
  firstLetter: string;
  onOpenMobileAppInfo?: () => void;
  onOpenConnectivityCheck?: () => void;
  onOpenGeneralSettings?: () => void;
  onOpenArchives?: () => void;
  onManageMutedUsers?: () => void;
  onManageFollowedUsers?: () => void;
  onGetRandomUser?: () => void;
  onOpenUsersPanel?: () => void;
}

// ============================================================================
// MAIN COMPONENT - Microsoft Enterprise Grade
// ============================================================================
export function SidebarMenu({
  isOpen,
  onClose,
  participantCount,
  businessName,
  firstLetter,
  onOpenMobileAppInfo,
  onOpenConnectivityCheck,
  onOpenGeneralSettings,
  onOpenArchives,
  onManageMutedUsers,
  onManageFollowedUsers,
  onGetRandomUser,
  onOpenUsersPanel,
}: SidebarMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // CLICK OUTSIDE HANDLER - Microsoft Pattern
  // ============================================================================
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // ============================================================================
  // ESCAPE KEY HANDLER - Microsoft Pattern
  // ============================================================================
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Don't render if closed
  if (!isOpen) return null;

  // ============================================================================
  // HELPER FUNCTION - Close menu and execute action
  // ============================================================================
  const handleMenuClick = (action?: () => void) => {
    onClose();
    action?.();
  };

  return (
    <div
      ref={menuRef}
      className="absolute left-0 mt-2 w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl text-white z-50 overflow-hidden"
      role="menu"
      aria-label="Quick settings menu"
    >
      {/* ========================================================================
          HEADER SECTION
      ======================================================================== */}
      <div className="px-4 py-2 border-b border-slate-700">
        <div className="text-sm font-medium text-slate-300">Close Sidebar</div>
      </div>

      {/* ========================================================================
          POWERED BY SECTION
      ======================================================================== */}
      <div className="px-4 py-3 border-b border-slate-700">
        <div className="text-xs text-slate-400 mb-1">Powered by:</div>
        <a
          className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
          href="https://protradingroom.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          ProTradingRoom.com
        </a>
        <div className="text-xs text-slate-500 mt-1">
          Version: {import.meta.env.VITE_APP_VERSION}
        </div>
      </div>

      {/* ========================================================================
          MOBILE APP INFO BUTTON
      ======================================================================== */}
      <div className="px-4 py-3 border-b border-slate-700">
        <button
          className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm font-medium text-white transition-colors"
          onClick={() => handleMenuClick(onOpenMobileAppInfo)}
          type="button"
        >
          Mobile App Info
        </button>
      </div>

      {/* ========================================================================
          STATUS SECTION
      ======================================================================== */}
      <div className="px-4 py-2 border-b border-slate-700">
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
          <SettingsIcon className="w-3 h-3 animate-spin" />
          <span>Reconnecting Media...</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span>Chat</span>
          <CheckCircle2 className="w-3 h-3 text-green-500" />
        </div>
      </div>

      {/* ========================================================================
          MAIN MENU ITEMS
      ======================================================================== */}
      <div className="py-2">
        {/* Connectivity Check */}
        <button
          className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-700/50 transition-colors"
          onClick={() => handleMenuClick(onOpenConnectivityCheck)}
          type="button"
        >
          <Wifi className="w-4 h-4 text-slate-400" />
          <span className="text-slate-200">Connectivity Check</span>
        </button>

        {/* General Settings */}
        <button
          className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-700/50 transition-colors"
          onClick={() => handleMenuClick(onOpenGeneralSettings)}
          type="button"
        >
          <SettingsIcon className="w-4 h-4 text-slate-400" />
          <span className="text-slate-200">General Settings</span>
        </button>

        {/* Archives with dropdown */}
        <button
          className="w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-slate-700/50 transition-colors"
          onClick={() => handleMenuClick(onOpenArchives)}
          type="button"
        >
          <div className="flex items-center gap-3">
            <Archive className="w-4 h-4 text-slate-400" />
            <span className="text-slate-200">Archives</span>
          </div>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {/* Manage Muted Users */}
        <button
          className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-700/50 transition-colors"
          onClick={() => handleMenuClick(onManageMutedUsers)}
          type="button"
        >
          <VolumeX className="w-4 h-4 text-slate-400" />
          <span className="text-slate-200">Manage Muted Users</span>
        </button>

        {/* Manage Followed Users */}
        <button
          className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-700/50 transition-colors"
          onClick={() => handleMenuClick(onManageFollowedUsers)}
          type="button"
        >
          <Star className="w-4 h-4 text-slate-400" />
          <span className="text-slate-200">Manage Followed Users</span>
        </button>

        {/* Get Random User */}
        <button
          className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-700/50 transition-colors"
          onClick={() => handleMenuClick(onGetRandomUser)}
          type="button"
        >
          <Shuffle className="w-4 h-4 text-slate-400" />
          <span className="text-slate-200">Get Random User</span>
        </button>
      </div>

      {/* ========================================================================
          USERS SECTION - BOTTOM BAR
      ======================================================================== */}
      <div className="border-t border-slate-700 bg-slate-750">
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-300">Users:</span>
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-blue-600 text-white text-xs font-bold">
              {participantCount}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="p-1.5 hover:bg-slate-600 rounded transition-colors"
              onClick={() => handleMenuClick(onOpenUsersPanel)}
              aria-label="Search users"
            >
              <Search className="w-4 h-4 text-slate-400" />
            </button>
            <button
              className="p-1.5 hover:bg-slate-600 rounded transition-colors"
              aria-label="Sort users"
            >
              <ArrowUpDown className="w-4 h-4 text-slate-400" />
            </button>
            <button
              className="p-1.5 hover:bg-slate-600 rounded transition-colors"
              aria-label="Online status"
            >
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </button>
            <button
              className="p-1.5 hover:bg-slate-600 rounded transition-colors"
              aria-label="User settings"
            >
              <SettingsIcon className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* User Card */}
        <div className="px-4 py-3 flex items-center gap-3 hover:bg-slate-700/30 transition-colors cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-semibold">
            {firstLetter}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {businessName || 'User'}
            </div>
            <div className="text-xs text-slate-400 truncate">Online</div>
          </div>
          <button
            className="p-1 hover:bg-slate-600 rounded transition-colors"
            aria-label="User menu"
          >
            <MoreVertical className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
