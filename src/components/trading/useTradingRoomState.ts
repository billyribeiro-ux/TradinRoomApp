/**
 * Trading Room State Hook - Microsoft Enterprise Standards
 * =========================================================
 * Centralized state management for TradingRoom component
 * Handles all local state, store selectors, and derived state
 *
 * FINAL FIX:
 * - Vertical resize logic is now STANDARD:
 * - Drag UP = Alerts panel SHRINKS.
 * - Drag DOWN = Alerts panel GROWS.
 * - Keyboard logic now matches:
 * - Arrow UP = Alerts panel SHRINKS.
 * - Arrow DOWN = Alerts panel GROWS.
 */

import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';

// --- Simple Persistence ---
const DEFAULTS = { leftPanelWidth: 480, alertsHeight: 300 };
const STORAGE_KEY = 'tradingRoom.layout.v1';

import { usePanelResizer } from '../../hooks/usePanelResizer';
import { useResizeObserver } from '../../hooks/useResizeObserver';
import { liveKitService } from '../../services/livekit';
import { useAuthStore } from '../../store/authStore';
import { useRoomStore } from '../../store/roomStore';
import { useThemeStore } from '../../store/themeStore';
import type { Database } from '../../types/database.types';
import { useContainerSize } from '../hooks';
import type { ResizeStartEvent } from './types'; // Import ResizeStartEvent

// Database types
type RoomRow = Database['public']['Tables']['rooms']['Row'];
type UserRow = Database['public']['Tables']['users']['Row'];
type RoomMembershipRow = Database['public']['Tables']['room_memberships']['Row'];
type AlertRow = Database['public']['Tables']['alerts']['Row'];
type ChatMessageRow = Database['public']['Tables']['chatmessages']['Row'];

import { BASE_CSS_VARS } from './constants';
import type { WhiteboardEvent } from '../../features/whiteboard/types';

// --- Constants ---
const MIN_LEFT_PANEL_WIDTH = 280;
const MAX_LEFT_PANEL_WIDTH_VW = 0.7; // 70vw

/**
 * Clamps a number between a minimum and maximum value.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}


const MAX_WHITEBOARD_EVENTS = 100;

export interface UseTradingRoomStateReturn {
  // Store selectors
  room: RoomRow | undefined;
  user: UserRow | undefined;
  colors: Record<string, string>;
  typography: Record<string, string>;
  canRecord: boolean;
  canManageRoom: boolean;
  isRecording: boolean;
  isMicEnabled: boolean;
  isRoomReady: boolean;
  stableUserId: string | undefined;
  themeBootstrapped: boolean;
  containerStyle: React.CSSProperties;
  
  // Local state
  isRefreshing: boolean;
  isWhiteboardActive: boolean;
  whiteboardEvents: WhiteboardEvent[];
  leftPanelWidth: number;
  alertsHeight: number;
  isResizingLeft: boolean;
  isResizingVertical: boolean;
  cameraEnabled: boolean;
  cameraStream: MediaStream | undefined;
  audioStream: MediaStream | undefined;
  showCameraWindow: boolean;
  showBranding: boolean;
  showSettings: boolean;
  showGeneralSettings: boolean;
  showConnectivityCheck: boolean;
  showMobileAppInfo: boolean;
  showArchives: boolean;
  showMutedUsers: boolean;
  showFollowedUsers: boolean;
  showRandomUser: boolean;
  showUsersPanel: boolean;
  showAlertModal: boolean;
  showPollModal: boolean;
  showThemePanel: boolean;
  contentTab: 'screens' | 'notes' | 'files';
  spotifyConnected: boolean;
  linkedinConnected: boolean;
  xConnected: boolean;
  
  // Refs (minimal - enterprise resize system)
  sizeRef: React.RefObject<HTMLDivElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  leftPanelRef: React.RefObject<HTMLElement>;
  
  // Size tracking
  size: { w: number; h: number } | null;
  
  // Store actions
  setCurrentRoom: (room: RoomRow | undefined) => void;
  setMessages: (messages: ChatMessageRow[]) => void;
  setAlerts: (alerts: AlertRow[]) => void;
  setMembership: (membership: RoomMembershipRow | undefined) => void;
  setTracks: (tracks: unknown[]) => void;
  setRecording: (recording: boolean) => void;
  setMicEnabled: (enabled: boolean) => void;
  setRoomReady: (ready: boolean) => void;
  
  // State setters
  setIsRefreshing: (refreshing: boolean) => void;
  setIsWhiteboardActive: (active: boolean) => void;
  setLeftPanelWidth: (width: number) => void;
  setAlertsHeight: (height: number) => void;
  setIsResizingLeft: (resizing: boolean) => void;
  setIsResizingVertical: (resizing: boolean) => void;
  setCameraEnabled: (enabled: boolean) => void;
  setCameraStream: (stream: MediaStream | undefined) => void;
  setAudioStream: (stream: MediaStream | undefined) => void;
  setShowCameraWindow: (show: boolean) => void;
  setShowBranding: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setShowGeneralSettings: (show: boolean) => void;
  setShowConnectivityCheck: (show: boolean) => void;
  setShowMobileAppInfo: (show: boolean) => void;
  setShowArchives: (show: boolean) => void;
  setShowMutedUsers: (show: boolean) => void;
  setShowFollowedUsers: (show: boolean) => void;
  setShowRandomUser: (show: boolean) => void;
  setShowUsersPanel: (show: boolean) => void;
  setShowAlertModal: (show: boolean) => void;
  setShowPollModal: (show: boolean) => void;
  setShowThemePanel: (show: boolean) => void;
  setContentTab: (tab: 'screens' | 'notes' | 'files') => void;
  setSpotifyConnected: (connected: boolean) => void;
  setLinkedinConnected: (connected: boolean) => void;
  setXConnected: (connected: boolean) => void;
  
  // Layout actions
  resetLayout: () => void;
  
  // Event handlers
  handleWhiteboardEvent: (event: WhiteboardEvent) => void;
  handleLeftResizeStart: (e: ResizeStartEvent) => void;
  handleVerticalResizeDown: (e: ResizeStartEvent) => void;
  
  // Keyboard handler signatures updated to match types.ts
  handleKeyboardResize: (delta: number) => void;
  handleKeyboardSnap: (edge: 'min' | 'max') => void;
}

export function useTradingRoomState(): UseTradingRoomStateReturn {
  // =========================================================
  // STORE SELECTORS (sliced to prevent unnecessary re-renders)
  // =========================================================
  const user = useAuthStore((s) => s.user);
  const { colors, typography } = useThemeStore();

  const room = useRoomStore((s) => s.currentRoom);
  const membership = useRoomStore((s) => s.membership);
  const canRecord = membership?.role === 'admin' || membership?.role === 'member';
  const canManageRoom = membership?.role === 'admin';
  const isRecording = useRoomStore((s) => s.isRecording);
  const isMicEnabled = useRoomStore((s) => s.isMicEnabled);

  // Store actions
  const setCurrentRoom = useRoomStore((s) => s.setCurrentRoom);
  const setMessages = useRoomStore((s) => s.setMessages);
  const setAlerts = useRoomStore((s) => s.setAlerts);
  const setMembership = useRoomStore((s) => s.setMembership);
  const setTracks = useRoomStore((s) => s.setTracks);
  const setRecordingStore = useRoomStore((s) => s.setRecording);
  const setRecording = useCallback((recording: boolean) => {
    setRecordingStore(recording, undefined);
  }, [setRecordingStore]);
  const setMicEnabled = useRoomStore((s) => s.setMicEnabled);
  const setRoomReady = useRoomStore((s) => s.setRoomReady);
  const isRoomReady = useRoomStore((s) => s.isRoomReady);
  
  const themeBootstrapped = typeof document !== 'undefined' && 
    document.documentElement.getAttribute('data-theme-bootstrap') === '1';
  const stableUserId = user?.id;

  // =========================================================
  // LOCAL COMPONENT STATE
  // =========================================================
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResizingVertical, setIsResizingVertical] = useState(false);

  // =========================================================
  // WHITEBOARD STATE
  // =========================================================
  const [isWhiteboardActive, setIsWhiteboardActive] = useState(false);
  const [whiteboardEvents, setWhiteboardEvents] = useState<WhiteboardEvent[]>([]);

  // Handle whiteboard events
  const handleWhiteboardEvent = useCallback((event: WhiteboardEvent) => {
    if (!canManageRoom) return;
    
    // Broadcast to other participants via LiveKit data channel
    const room = liveKitService.getRoom();
    if (room) {
      room.localParticipant.publishData(
        new TextEncoder().encode(JSON.stringify(event)),
        { reliable: true }
      );
    }
    
    // Update local state with bounded array (prevent memory leak)
    setWhiteboardEvents(prev => {
      const updated = [...prev, event];
      return updated.length > MAX_WHITEBOARD_EVENTS 
        ? updated.slice(-MAX_WHITEBOARD_EVENTS) 
        : updated;
    });
  }, [canManageRoom]);

  // =========================================================
  // CONTAINER SIZE & RESPONSIVE LAYOUT
  // =========================================================
  const { ref: sizeRef, size } = useContainerSize<HTMLDivElement>();
  const containerRef = sizeRef; // Alias for compatibility

  // Container style based on size
  const containerStyle = useMemo(() => {
    return {};
  }, []);

  // Enterprise pattern: Whiteboard state validation (development only)
  useEffect(() => {
    if (import.meta.env.MODE === 'development') {
      console.log('[TradingRoomState] 🎨 Whiteboard:', {
        canManageRoom,
        isWhiteboardActive,
        role: membership?.role,
        size,
        sizeValid: size && size.w > 0 && size.h > 0
      });
    }
  }, [canManageRoom, isWhiteboardActive, membership?.role, size]);

  // =========================================================
  // LAYOUT STATE - ENTERPRISE RESIZE SYSTEM
  // =========================================================
  
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(DEFAULTS.leftPanelWidth);
  const [alertsHeight, setAlertsHeight] = useState<number>(DEFAULTS.alertsHeight);
  
  // Load persisted values on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { leftPanelWidth, alertsHeight } = JSON.parse(raw);
        if (typeof leftPanelWidth === 'number') setLeftPanelWidth(leftPanelWidth);
        if (typeof alertsHeight === 'number') setAlertsHeight(alertsHeight);
      }
    } catch {}
  }, []);
  
  // Persist changes with rAF
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ leftPanelWidth, alertsHeight }));
      } catch {}
    });
    return () => cancelAnimationFrame(id);
  }, [leftPanelWidth, alertsHeight]);
  
  // Reset layout function
  const resetLayout = useCallback(() => {
    setLeftPanelWidth(DEFAULTS.leftPanelWidth);
    setAlertsHeight(DEFAULTS.alertsHeight);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULTS));
    } catch {}
  }, []);

  // Observe container size for automatic responsive adjustments (use existing sizeRef)
  const containerSize = useResizeObserver(sizeRef as React.RefObject<HTMLElement>);

  // Manual resize logic with proper offset calculation
  const { 
    isResizing: isResizingLeft, 
    handleMouseDown: handleLeftResizeMouseDown 
  } = usePanelResizer(
    () => {
      // Use containerSize if available, fallback to window.innerWidth
      const viewportWidth = containerSize.width > 0 ? containerSize.width : window.innerWidth;
      return {
        min: MIN_LEFT_PANEL_WIDTH,
        max: Math.min(viewportWidth * MAX_LEFT_PANEL_WIDTH_VW, viewportWidth - 360),
        containerSize: viewportWidth,
      };
    },
    setLeftPanelWidth
  );

  // Provide setter for compatibility (usePanelResizer manages the state)
  const setIsResizingLeft = useCallback(() => {
    // No-op: isResizingLeft is managed by usePanelResizer
  }, []);

  // Automatic resize logic - clamp when browser resizes
  useEffect(() => {
    const viewportWidth = containerSize.width > 0 ? containerSize.width : window.innerWidth;
    const maxWidth = Math.min(viewportWidth * MAX_LEFT_PANEL_WIDTH_VW, viewportWidth - 360);
    if (leftPanelWidth > maxWidth) {
      const clamped = clamp(leftPanelWidth, MIN_LEFT_PANEL_WIDTH, maxWidth);
      setLeftPanelWidth(clamped);
    }
  }, [containerSize.width, leftPanelWidth]);

  // Handler for resize start
  const handleLeftResizeStart = useCallback((e: ResizeStartEvent) => {
    // Pass the full event to usePanelResizer which now handles all event types
    handleLeftResizeMouseDown(e, leftPanelWidth);
  }, [handleLeftResizeMouseDown, leftPanelWidth]);

  // =========================================================
  // VERTICAL RESIZE HANDLER (FIXED)
  // =========================================================
  const handleVerticalResizeDown = useCallback((e: ResizeStartEvent) => {
    e.preventDefault();
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId); // Capture the pointer
    
    const startHeight = alertsHeight;
    const startY = e.clientY;
    
    // FIXED: Calculate height from the actual main element, not root container
    // Root container includes header, but alerts panel is inside main
    const mainElement = sizeRef.current?.querySelector('main') as HTMLElement | null;
    const containerHeight = mainElement?.clientHeight || sizeRef.current?.clientHeight || window.innerHeight;
    const minHeight = 120;
    const maxHeight = Math.round(containerHeight * 0.6);
    
    setIsResizingVertical(true);
    
    // rAF optimization
    let rafId: number | null = null;
    let lastY = startY;

    const handleMove = (moveEvent: PointerEvent): void => {
      moveEvent.preventDefault(); // Prevent text selection during drag
      lastY = moveEvent.clientY;

      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      
      rafId = requestAnimationFrame(() => {
        // ⭐⭐⭐ ENTERPRISE-GRADE LOGIC ⭐⭐⭐
        const deltaY = lastY - startY;
        // Drag UP (clientY↓) → deltaY < 0 → height SHRINKS ✓
        // Drag DOWN (clientY↑) → deltaY > 0 → height GROWS ✓
        
        const newHeight = startHeight + deltaY;
        const clampedHeight = clamp(newHeight, minHeight, maxHeight);
        setAlertsHeight(clampedHeight);
        rafId = null;
      });
    };
    
    const handleEnd = (endEvent: PointerEvent): void => {
      target.releasePointerCapture(endEvent.pointerId);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      
      setIsResizingVertical(false);
      // FIXED: Remove listeners from target, not window
      target.removeEventListener('pointermove', handleMove as EventListener);
      target.removeEventListener('pointerup', handleEnd as EventListener);
      target.removeEventListener('pointercancel', handleEnd as EventListener);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.touchAction = '';
    };
    
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    document.body.style.touchAction = 'none';
    
    // FIXED: Listen on captured target element, not window
    // This is the correct pattern when using setPointerCapture
    target.addEventListener('pointermove', handleMove as EventListener);
    target.addEventListener('pointerup', handleEnd as EventListener, { once: true });
    target.addEventListener('pointercancel', handleEnd as EventListener, { once: true });
  }, [alertsHeight, sizeRef]);

  // =========================================================
  // KEYBOARD HANDLERS (FIXED)
  // =========================================================
  const handleKeyboardResize = useCallback((delta: number) => {
    // `HorizontalResizeHandle` sends a negative delta for "Up"
    
    // FIXED: Use same container height calculation as pointer handler
    const mainElement = sizeRef.current?.querySelector('main') as HTMLElement | null;
    const containerHeight = mainElement?.clientHeight || sizeRef.current?.clientHeight || window.innerHeight;
    const minHeight = 120;
    const maxHeight = Math.round(containerHeight * 0.6);

    setAlertsHeight(prev => {
      // ⭐⭐⭐ ENTERPRISE-GRADE LOGIC ⭐⭐⭐
      // We ADD the delta.
      // Arrow UP = delta is -8. newHeight = prev + (-8) = prev - 8 (SHRINKS)
      // Arrow DOWN = delta is +8. newHeight = prev + (8) = prev + 8 (GROWS)
      const newHeight = prev + delta;
      return clamp(newHeight, minHeight, maxHeight);
    });
  }, [sizeRef]);

  const handleKeyboardSnap = useCallback((edge: 'min' | 'max') => {
    // FIXED: Use same container height calculation as pointer handler
    const mainElement = sizeRef.current?.querySelector('main') as HTMLElement | null;
    const containerHeight = mainElement?.clientHeight || sizeRef.current?.clientHeight || window.innerHeight;
    const minHeight = 120;
    const maxHeight = Math.round(containerHeight * 0.6);

    setAlertsHeight(edge === 'min' ? minHeight : maxHeight);
  }, [sizeRef]);


  // =========================================================
  // RESIZING STATE
  // =========================================================
  // (Duplicate removed)

  // =========================================================
  // CAMERA & MEDIA STATE
  // =========================================================
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | undefined>();
  const [audioStream, setAudioStream] = useState<MediaStream | undefined>();
  const [showCameraWindow, setShowCameraWindow] = useState(true);

  // =========================================================
  // UI PANEL STATE
  // =========================================================
  const [showBranding, setShowBranding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGeneralSettings, setShowGeneralSettings] = useState(false);
  const [showConnectivityCheck, setShowConnectivityCheck] = useState(false);
  const [showMobileAppInfo, setShowMobileAppInfo] = useState(false);
  const [showArchives, setShowArchives] = useState(false);
  const [showMutedUsers, setShowMutedUsers] = useState(false);
  const [showFollowedUsers, setShowFollowedUsers] = useState(false);
  const [showRandomUser, setShowRandomUser] = useState(false);
  const [showUsersPanel, setShowUsersPanel] = useState(false);
  const [showAlertModal, setShowAlertModalInternal] = useState(() => {
    // console.log('[TradingRoomState] Initializing showAlertModal to FALSE');
    return false;
  });
  
  // Wrapped setter with logging
  const setShowAlertModal = (value: boolean | ((prev: boolean) => boolean)): void => {
    const newValue = typeof value === 'function' ? value(showAlertModal) : value;
    // console.log('[TradingRoomState] setShowAlertModal called:', newValue);
    setShowAlertModalInternal(newValue);
  };
  const [showPollModal, setShowPollModal] = useState(false);
  const [showThemePanel, setShowThemePanel] = useState(false);
  const [contentTab, setContentTab] = useState<'screens' | 'notes' | 'files'>('screens');

  // =========================================================
  // INTEGRATION STATE
  // =========================================================
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [linkedinConnected, setLinkedinConnected] = useState(false);
  const [xConnected, setXConnected] = useState(false);

  // =========================================================
  // REFS (Enterprise resize system - minimal)
  // =========================================================
  const leftPanelRef = useRef<HTMLDivElement>(null);

  // =========================================================
  // NOTE: Smooth resize utilities removed
  // Panel sizing is handled exclusively by TradingRoomContainer handlers
  // =========================================================

  // =========================================================
  // BASE CSS VARIABLES SETUP (FOUC Prevention)
  // =========================================================
  useLayoutEffect(() => {
    const root = document.documentElement;
    const s = 1; // temporary scale; will be adjusted after container measurement
    
    root.style.setProperty('--vertical-resizer-width', `${BASE_CSS_VARS.verticalResizerWidth * s}px`);
    root.style.setProperty('--alert-header-height', `${BASE_CSS_VARS.alertHeaderHeight * s}px`);
    root.style.setProperty('--alert-item-height', `${BASE_CSS_VARS.alertItemHeight * s}px`);
    
    // Set initial panel dimensions
    root.style.setProperty('--panel-width', `${leftPanelWidth}px`);
    root.style.setProperty('--alert-height', `${alertsHeight}px`);
  }, []); // Removed leftPanelWidth and alertsHeight, this should only run once

  // =========================================================
  // THEME TYPOGRAPHY APPLICATION
  // =========================================================
  useEffect(() => {
    const root = document.documentElement;
    if (!typography) return;
    if (themeBootstrapped) return;
    
    const headingWeight = String(typography.fontWeightBold ?? '700');
    const bodyWeight = String(typography.fontWeightNormal ?? '400');
    const baseSize = typeof typography.fontSizeBase === 'number'
      ? `${typography.fontSizeBase}px`
      : (typography.fontSizeBase || '16px');

    root.style.setProperty('--font-heading', typography.fontFamily || 'inherit');
    root.style.setProperty('--font-body', typography.fontFamily || 'inherit');
    root.style.setProperty('--font-heading-weight', headingWeight);
    root.style.setProperty('--font-body-weight', bodyWeight);
    root.style.setProperty('--font-base-size', baseSize);
  }, [typography, themeBootstrapped]);

  // =========================================================
  // ACCENT COLOR APPLICATION
  // =========================================================
  useEffect(() => {
    const accent = colors.accent || '#2563eb';
    const root = document.documentElement;
    
    root.style.setProperty('--accent-color', accent);
    root.style.setProperty('--live-accent', accent);
  }, [colors.accent]);

  // =========================================================
  // PANEL DIMENSIONS - Update CSS variables on change
  // =========================================================
  useEffect(() => {
    document.documentElement.style.setProperty('--panel-width', `${leftPanelWidth}px`);
  }, [leftPanelWidth]);

  useEffect(() => {
    document.documentElement.style.setProperty('--alert-height', `${alertsHeight}px`);
  }, [alertsHeight]);

  // =========================================================
  // RETURN BLOCK (FIXED: Restored missing code)
  // =========================================================
  return {
    // Store selectors
    room,
    user: user as unknown as UserRow | undefined, // User from auth store matches UserRow structure
    colors,
    typography,
    canRecord,
    canManageRoom,
    isRecording,
    isMicEnabled,
    isRoomReady,
    stableUserId,
    themeBootstrapped,
    
    // Local state
    isRefreshing,
    isWhiteboardActive,
    whiteboardEvents,
    leftPanelWidth,
    alertsHeight,
    isResizingLeft,
    isResizingVertical,
    cameraEnabled,
    cameraStream,
    audioStream,
    showCameraWindow,
    showBranding,
    showSettings,
    showGeneralSettings,
    showConnectivityCheck,
    showMobileAppInfo,
    showArchives,
    showMutedUsers,
    showFollowedUsers,
    showRandomUser,
    showUsersPanel,
    showAlertModal,
    showPollModal,
    showThemePanel,
    contentTab,
    spotifyConnected,
    linkedinConnected,
    xConnected,
    
    // Refs
    sizeRef,
    containerRef,
    leftPanelRef,
    
    // Container size
    size,
    
    // Container style
    containerStyle,
    
    // Store actions
    setCurrentRoom,
    setMessages,
    setAlerts,
    setMembership,
    setTracks: setTracks as (tracks: unknown[]) => void,
    setRecording,
    setMicEnabled,
    setRoomReady,
    
    // State setters
    setIsRefreshing,
    setIsWhiteboardActive,
    setLeftPanelWidth,
    setAlertsHeight,
    setIsResizingLeft,
    setIsResizingVertical,
    setCameraEnabled,
    setCameraStream,
    setAudioStream,
    setShowCameraWindow,
    setShowBranding,
    setShowSettings,
    setShowGeneralSettings,
    setShowConnectivityCheck,
    setShowMobileAppInfo,
    setShowArchives,
    setShowMutedUsers,
    setShowFollowedUsers,
    setShowRandomUser,
    setShowUsersPanel,
    setShowAlertModal,
    setShowPollModal,
    setShowThemePanel,
    setContentTab,
    setSpotifyConnected,
    setLinkedinConnected,
    setXConnected,
    
    // Layout actions
    resetLayout,
    
    // Event handlers
    handleWhiteboardEvent,
    handleLeftResizeStart,
    handleVerticalResizeDown,
    handleKeyboardResize,
    handleKeyboardSnap,
  };
}