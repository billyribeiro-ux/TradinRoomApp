/**
 * Trading Room Types - Microsoft Enterprise Standards
 * =========================================================
 * Complete type definitions with strict typing (no `any` leaks in public APIs)
 */

import type { CSSProperties, RefObject } from 'react';
import type { Room, User } from '../../types/database.types';
import type { DeviceType } from './constants';

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/**
 * FIXED: Upgraded to PointerEvent.
 * This is the modern standard and handles mouse, touch, and pen
 * with a single event type.
 */
export type ResizeStartEvent = React.PointerEvent<HTMLDivElement>;

export type Px = number;
export type ContentTab = 'screens' | 'notes' | 'files';

export interface Size {
  readonly w: number;
  readonly h: number;
}

// ---------------------------------------------------------------------------
// CORE STATE (SSOT-facing view used by TradingRoomLayout)
// ---------------------------------------------------------------------------

export interface TradingRoomState {
  readonly room: Room;
  readonly user: User | null;

  readonly containerStyle: CSSProperties;

  readonly canRecord: boolean;
  readonly canManageRoom: boolean;

  readonly isRecording: boolean;
  readonly isMicEnabled: boolean;
  readonly cameraEnabled: boolean;

  readonly audioStream: MediaStream | null;
  readonly cameraStream: MediaStream | null;

  readonly spotifyConnected: boolean;
  readonly linkedinConnected: boolean;
  readonly xConnected: boolean;

  readonly isRefreshing: boolean;
  readonly contentTab: ContentTab;

  readonly isWhiteboardActive: boolean;
  readonly whiteboardEvents: unknown[];

  readonly size: Size | null;

  readonly showConnectivityCheck: boolean;
  readonly showMobileAppInfo: boolean;
  readonly showAlertModal: boolean;
  readonly showPollModal: boolean;
  readonly showThemePanel: boolean;
  readonly showCameraWindow: boolean;
  readonly showBranding: boolean;
  readonly showSettings: boolean;

  // Resizing
  readonly isResizingLeft: boolean;
  readonly isResizingVertical: boolean;
  readonly leftPanelWidth: Px;
  readonly alertsHeight: Px;
}

export interface PanelSizes {
  readonly sidebarWidth: Px;
  readonly alertHeight: Px;
}

export interface DeviceInfo {
  readonly width: Px;
  readonly height: Px;
  readonly device: DeviceType;
}

// ---------------------------------------------------------------------------
// COMPONENT PROPS
// ---------------------------------------------------------------------------

export interface TradingRoomLayoutProps {
  readonly state: TradingRoomState;
  readonly handlers: TradingRoomHandlers;
  readonly refs: TradingRoomRefs;
}

export interface TradingRoomHandlers {
  // Top bar / general
  readonly handleCustomizeClick: () => void;
  readonly handleOpenSettings: () => void;
  readonly handleLeave: () => void;
  readonly handleRefresh: () => void;

  // Media controls
  readonly handleToggleMic: () => Promise<void>;
  readonly handleToggleCamera: () => Promise<void>;
  // NOTE: container implementation is synchronous today, so keep this as void
  readonly handleToggleRecording: () => void;

  // Integrations
  readonly handleSpotifyConnect: () => void;
  readonly handleSpotifyDisconnect: () => void;
  readonly handleLinkedInConnect: () => void;
  readonly handleLinkedInDisconnect: () => void;
  readonly handleXConnect: () => void;
  readonly handleXDisconnect: () => void;

  // Dialogs / modals
  readonly handleShowConnectivityCheck: () => void;
  readonly handleShowMobileAppInfo: () => void;
  readonly handleCloseConnectivityCheck: () => void;
  readonly handleCloseMobileAppInfo: () => void;

  // Resizers (starters only; move/commit handled internally)
  /** FIXED: Event type upgraded to ResizeStartEvent (which is PointerEvent) */
  readonly handleVerticalResizeDown: (e: ResizeStartEvent) => void; // alerts ↕ chat
  /** FIXED: Event type upgraded to ResizeStartEvent (which is PointerEvent) */
  readonly handleLeftResizeStart: (e: ResizeStartEvent) => void; // left ↔ main

  // Keyboard handlers
  /**
   * FIXED: Signature simplified. The component shouldn't pass the raw
   * event, just the pixel delta.
   */
  readonly handleKeyboardResize: (delta: number) => void;

  /**
   * FIXED: Signature simplified. The component shouldn't pass the raw
   * event, just the edge to snap to.
   */
  readonly handleKeyboardSnap: (edge: 'min' | 'max') => void;

  // Tabs / whiteboard
  readonly onTabChange: (tab: ContentTab) => void;
  readonly onWhiteboardOpen: () => void;
  readonly onWhiteboardClose: () => void;
  readonly onWhiteboardEvent: (event: unknown) => void;

  // Modals close
  readonly handleShowAlertModalClose: () => void;
  readonly handleShowPollModalClose: () => void;
  readonly handleThemePanelClose: () => void;
  readonly handleCameraWindowClose: () => void;

  // Modals open
  readonly handleShowAlertModalOpen: () => void;
  readonly handleShowPollModalOpen: () => void;

  // State setters
  readonly setShowBranding: (show: boolean) => void;
  readonly setShowSettings: (show: boolean) => void;

  // Layout reset
  readonly handleResetLayout: () => void;

  // Moderation handlers for alerts
  readonly handleMuteUser: (userId: string, displayName: string) => void;
  readonly handleBanUser: (userId: string, displayName: string) => Promise<void>;
  readonly handleKickUser: (userId: string, displayName: string) => Promise<void>;
  readonly handleReportAlert: (alertId: string) => Promise<void>;
  readonly handleMentionUser: (displayName: string) => void;
  readonly handleUserInfo: (userId: string, displayName: string) => Promise<void>;
  readonly handlePrivateChat: (userId: string, displayName: string) => Promise<void>;
  readonly handleShowToAll: (alertId: string) => Promise<void>;
}

export interface TradingRoomRefs {
  readonly sizeRef: RefObject<HTMLDivElement>;
  readonly containerRef: RefObject<HTMLDivElement>;
  readonly leftPanelRef: RefObject<HTMLElement>;
}

// ---------------------------------------------------------------------------
// Toolbar (if/when used by header or floating controls)
// ---------------------------------------------------------------------------

export interface ToolbarProps {
  readonly isMicEnabled: boolean;
  readonly isCameraEnabled: boolean;
  readonly isScreenSharing: boolean;
  readonly isRecording: boolean;
  readonly canRecord: boolean;

  readonly onToggleMic: () => Promise<void>;
  readonly onToggleCamera: () => Promise<void>;
  readonly onToggleScreenShare: () => Promise<void>;
  // Keep sync with container: currently not async
  readonly onToggleRecording: () => void;

  readonly onOpenSettings: () => void;
  readonly onOpenWhiteboard: () => void;
}

// ---------------------------------------------------------------------------
// HOOK RETURN TYPES
// ---------------------------------------------------------------------------

export interface UseAudioVideoControllerReturn {
  readonly isMicEnabled: boolean;
  readonly isCameraEnabled?: boolean; // optional: current container manages camera via service
  readonly toggleMic: () => Promise<void>;
  readonly toggleCamera?: () => Promise<void>; // optional to avoid mismatch with current container
  readonly cleanup: () => void;
}

export interface UseScreenShareControllerReturn {
  readonly isSharing: boolean;
  readonly toggleScreenShare: () => Promise<void>;
  readonly cleanup: () => void;
}

// ---------------------------------------------------------------------------
// ERROR TYPES
// ---------------------------------------------------------------------------

export interface TradingRoomError extends Error {
  readonly code: string;
  readonly context?: Record<string, unknown>;
  readonly timestamp: Date;
  readonly retryable: boolean;
}