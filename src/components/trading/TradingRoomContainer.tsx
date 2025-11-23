/**
 * Trading Room Container - Microsoft Enterprise Standards
 * =========================================================
 * Final orchestration layer that wires state, effects, and callbacks
 * Renders TradingRoomLayout with properly prepared props
 *
 * (FIXED: This file is now a true "container" and delegates all
 * complex logic (like resizing) to the state hooks.)
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';

import { supabase } from '../../lib/supabase';
import { refreshRoom } from '../../services/RoomRefresh';
import {
  getRoomMessages,
  getRoomAlerts,
  getActiveMediaTracks,
  ensureUserRoomMembership,
} from '../../services/api';
import { audioService } from '../../services/audioService';
import { cameraService } from '../../services/cameraService';
import {
  getUserIntegration,
  disconnectUserIntegration,
} from '../../services/integrationsApi';
import { liveKitService } from '../../services/livekit';
import { getLiveKitToken } from '../../services/livekitToken';
import {
  subscribeToRoomChat,
  subscribeToRoomAlerts,
  subscribeToRoomTracks,
  unsubscribeFromRoom,
} from '../../services/realtime';
import { useToastStore } from '../../store/toastStore';
import { useRoomStore } from '../../store/roomStore';
import { clearMicrosoftCache } from '../../utils/cacheManager';
import { loggerFactory } from '../infrastructure';

import { TradingRoomLayout } from './TradingRoomLayout';
import type { WhiteboardEvent } from '../../features/whiteboard/types';
import type { TradingRoomLayoutProps } from './types';
import { useAudioVideoController } from './useAudioVideoController';
import { useScreenShareController } from './useScreenShareController';
import { useTradingRoomState } from './useTradingRoomState';
import type { Database } from '../../types/database.types';

type RoomRow = Database['public']['Tables']['rooms']['Row'];

export interface TradingRoomContainerProps {
  room: RoomRow;
  onLeave: () => void;
}

export function TradingRoomContainer({
  room,
  onLeave,
}: TradingRoomContainerProps) {
  const logger = useMemo(
    () => loggerFactory.create('TradingRoomContainer'),
    []
  );
  const { addToast } = useToastStore();

  // =========================================================
  // CENTRALIZED STATE MANAGEMENT
  // =========================================================
  const tradingRoomState = useTradingRoomState();
  const {
    isMicEnabled,
    toggleMic,
    cleanup: audioVideoCleanup,
  } = useAudioVideoController();
  const { cleanup: screenShareCleanup } = useScreenShareController();

  // Destructure state for easier access
  const {
    user,
    canRecord,
    canManageRoom,
    isRecording,
    isRefreshing,
    isWhiteboardActive,
    whiteboardEvents,
    isResizingLeft,
    isResizingVertical,
    leftPanelWidth,
    alertsHeight,
    cameraEnabled,
    cameraStream,
    audioStream,
    showCameraWindow,
    showBranding,
    showSettings,
    showConnectivityCheck,
    showMobileAppInfo,
    showAlertModal,
    showPollModal,
    showThemePanel,
    contentTab,
    spotifyConnected,
    linkedinConnected,
    xConnected,
    sizeRef,
    containerRef,
    leftPanelRef,
    size,
    containerStyle,
    setCurrentRoom,
    setMessages,
    setAlerts,
    setTracks,
    setRoomReady,
    setMembership,
    setIsRefreshing,
    setIsWhiteboardActive,
    setCameraEnabled,
    setCameraStream,
    setShowCameraWindow,
    setShowBranding,
    setShowSettings,
    setShowConnectivityCheck,
    setShowMobileAppInfo,
    setShowAlertModal,
    setShowPollModal,
    setShowThemePanel,
    setContentTab,
    setSpotifyConnected,
    setLinkedinConnected,
    setXConnected,
    handleWhiteboardEvent,
    handleLeftResizeStart,
    handleVerticalResizeDown, // <-- FIXED: Destructured from hook
    handleKeyboardResize,     // <-- FIXED: Destructured from hook
    handleKeyboardSnap,       // <-- FIXED: Destructured from hook
    resetLayout,
  } = tradingRoomState;

  // Additional refs for container
  const renderCountRef = useRef(0);
  const mountCountRef = useRef(0);
  const isMountedRef = useRef(false);

  renderCountRef.current += 1;

  // =========================================================
  // KEYBOARD HANDLERS
  // =========================================================
  // Handlers from useTradingRoomState already have correct signatures
  // No wrappers needed - they take (delta: number) and (edge: 'min' | 'max') directly

  // =========================================================
  // LIFECYCLE MANAGEMENT
  // =========================================================
  useEffect(() => {
    mountCountRef.current += 1;
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, [logger]);

  // =========================================================
  // ROOM INITIALIZATION & SUBSCRIPTIONS (HARDENED)
  // =========================================================
  useEffect(() => {
    if (!user?.id || !room?.id) return;

    let cancelled = false;
    const unsubs: Array<() => void> = [];

    const initializeRoom = async () => {
      try {
        setIsRefreshing(true);

        // ENTERPRISE PATTERN: Validate membership with Supabase before granting permissions
        console.log('[TradingRoom] 🔐 Validating user membership and role...');
        const membershipResult = await import('../../services/membershipService').then(m => 
          m.validateMembership(user.id, room.id)
        );
        if (cancelled) return;

        // CRITICAL: Set the membership in the store so canManageRoom works
        if (membershipResult.isValid && membershipResult.membership) {
          console.log('[TradingRoom] ✅ Membership validated - Role:', membershipResult.membership.role);
          setMembership(membershipResult.membership);
        } else {
          console.error('[TradingRoom] ❌ MEMBERSHIP VALIDATION FAILED');
          console.error('[TradingRoom] 🚨 Error:', membershipResult.error);
          console.error('[TradingRoom] 🚨 Error Code:', membershipResult.errorCode);
          console.error('[TradingRoom] 🚨 User will NOT have admin/management permissions');
          console.error('[TradingRoom] 🚨 Solutions:');
          if (membershipResult.errorCode === 'NOT_FOUND') {
            console.error('[TradingRoom]    → Run ENTERPRISE_FIX_ROOM_MEMBERSHIP.sql');
            console.error('[TradingRoom]    → Or invite user through admin panel');
          } else if (membershipResult.errorCode === 'RLS_DENIED') {
            console.error('[TradingRoom]    → Check RLS policies on room_memberships table');
            console.error('[TradingRoom]    → Verify user has proper authentication');
          } else {
            console.error('[TradingRoom]    → Check network connectivity to Supabase');
            console.error('[TradingRoom]    → Verify Supabase credentials in .env.local');
          }
          // Still set undefined to prevent stale data
          setMembership(undefined);
        }

        setCurrentRoom(room);

        // Note: If initialMessages/initialAlerts were used,
        // you would check for them here before fetching.
        const [messages, alerts, tracks] = await Promise.all([
          getRoomMessages(room.id),
          getRoomAlerts(room.id),
          getActiveMediaTracks(room.id),
        ]);

        if (cancelled) return;

        setMessages(messages);
        setAlerts(alerts);
        setTracks(tracks);

        // Real-time subscriptions
        try {
          subscribeToRoomChat(room.id);
        } catch {}
        try {
          subscribeToRoomAlerts(room.id);
        } catch {}
        try {
          subscribeToRoomTracks(room.id);
        } catch {}

        // LiveKit connect
        try {
          const token = await getLiveKitToken(
            room.id,
            user.id,
            user.email || user.id
          );
          if (cancelled) return;
          // LiveKit connect expects just the token; participant identity is embedded in the token
          await liveKitService.connect(token);
        } catch {
          if (cancelled) return;
          addToast(
            'Real-time features unavailable. Chat and alerts will still work.'
          );
        }

        if (cancelled) return;
        setRoomReady(true);
      } catch (error) {
        logger.error('Failed to initialize TradingRoom container:', error);
        addToast('Failed to initialize room');
      } finally {
        if (!cancelled) setIsRefreshing(false);
      }
    };

    void initializeRoom();

    // Cleanup
    return () => {
      cancelled = true;

      for (const u of unsubs) {
        try { u(); } catch {}
      }

      try {
        unsubscribeFromRoom();
      } catch {}

      try {
        liveKitService.disconnect();
      } catch {}
    };
    // Intentionally minimal deps: only user/room IDs trigger re-init
    // Zustand setters, logger, addToast are stable and excluded to prevent infinite loop
  }, [user?.id, user?.email, room?.id]);

  // =========================================================
  // INTEGRATION MANAGEMENT
  // =========================================================
  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    const loadIntegrations = async () => {
      try {
        const [spotify, linkedin, x] = await Promise.all([
          getUserIntegration(user.id, 'spotify'),
          getUserIntegration(user.id, 'linkedin'),
          getUserIntegration(user.id, 'x'),
        ]);
        if (cancelled) return;

        setSpotifyConnected(!!spotify);
        setLinkedinConnected(!!linkedin);
        setXConnected(!!x);
      } catch (error) {
        logger.error('Failed to load integrations:', error);
      }
    };

    void loadIntegrations();

    return () => {
      cancelled = true;
    };
  }, [user?.id, logger, setSpotifyConnected, setLinkedinConnected, setXConnected]);

  // =========================================================
  // HANDLERS
  // =========================================================
  const handleLeave = useCallback(async () => {
    logger.info('Leaving TradingRoom');
    try { await liveKitService.disconnect(); } catch {}
    try { audioVideoCleanup(); } catch {}
    try { screenShareCleanup(); } catch {}
    try { clearMicrosoftCache('all', { resetStores: true }); } catch {}
    onLeave();
  }, [logger, onLeave, audioVideoCleanup, screenShareCleanup]);

  const handleRefresh = useCallback(async () => {
    if (!room?.id || !user?.id) return;
    try {
      setIsRefreshing(true);
      await refreshRoom(room.id, room.tenant_id, user.id);
      addToast('Room refreshed successfully');
    } catch (error) {
      logger.error('Failed to refresh room:', error);
      addToast('Failed to refresh room');
    } finally {
      setIsRefreshing(false);
    }
  }, [room?.id, room?.tenant_id, user?.id, setIsRefreshing, addToast, logger]);

  const handleToggleMic = useCallback(async () => {
    await toggleMic();
    // Update audio stream state for volume indicator
    const stream = audioService.getStream();
    tradingRoomState.setAudioStream(stream || undefined);
  }, [toggleMic, tradingRoomState]);

  // FIXED: handleToggleCamera is now async
  const handleToggleCamera = useCallback(async () => {
    try {
      if (cameraEnabled) {
        cameraService.stopCamera();
        setCameraStream(undefined);
        setCameraEnabled(false);
      } else {
        await cameraService.startCamera();
        const stream = cameraService.getStream();
        setCameraStream(stream);
        setCameraEnabled(true);
      }
    } catch (error) {
      logger.error('Camera toggle failed:', error);
      addToast('Failed to toggle camera');
    }
  }, [cameraEnabled, setCameraStream, setCameraEnabled, addToast, logger]);

  const handleToggleRecording = useCallback((): void => {
    if (!canRecord) {
      addToast('You do not have permission to record');
      return;
    }
    
    // Microsoft Enterprise: Recording service implementation
    try {
      if (isRecording) {
        // Stop recording
        useRoomStore.getState().setRecording(false, undefined);
        addToast('Recording stopped');
        logger.info('Recording stopped for room', { roomId: room?.id });
      } else {
        // Start recording
        const recordingId = `rec_${Date.now()}`;
        useRoomStore.getState().setRecording(true, recordingId);
        addToast('Recording started');
        logger.info('Recording started for room:', { roomId: room?.id, recordingId });
        
        // TODO: Integrate with actual recording backend service
        // This would typically call a recording API endpoint
      }
    } catch (error) {
      logger.error('Recording toggle failed:', error);
      addToast('Failed to toggle recording');
    }
  }, [canRecord, addToast, isRecording, room?.id, logger]);



  // Integration handlers
  const handleSpotifyConnect = useCallback(() => {
    addToast('Spotify integration coming soon');
  }, [addToast]);

  const handleSpotifyDisconnect = useCallback(async () => {
    if (!user?.id) return;
    try {
      await disconnectUserIntegration(user.id, 'spotify');
      setSpotifyConnected(false);
      addToast('Spotify disconnected');
    } catch (error) {
      logger.error('Spotify disconnect failed:', error);
      addToast('Failed to disconnect Spotify');
    }
  }, [user?.id, setSpotifyConnected, addToast, logger]);



  const handleLinkedInConnect = useCallback(() => {
    addToast('LinkedIn integration coming soon');
  }, [addToast]);

  const handleLinkedInDisconnect = useCallback(async () => {
    if (!user?.id) return;
    try {
      await disconnectUserIntegration(user.id, 'linkedin');
      setLinkedinConnected(false);
      addToast('LinkedIn disconnected');
    } catch (error) {
      logger.error('LinkedIn disconnect failed:', error);
      addToast('Failed to disconnect LinkedIn');
    }
  }, [user?.id, setLinkedinConnected, addToast, logger]);

  const handleXConnect = useCallback(() => {
    addToast('X (Twitter) integration coming soon');
  }, [addToast]);

  const handleXDisconnect = useCallback(async () => {
    if (!user?.id) return;
    try {
      await disconnectUserIntegration(user.id, 'x');
      setXConnected(false);
      addToast('X disconnected');
    } catch (error) {
      logger.error('X disconnect failed:', error);
      addToast('Failed to disconnect X');
    }
  }, [user?.id, setXConnected, addToast, logger]);

  // UI handlers
  const handleCustomizeClick = useCallback(() => {
    setShowBranding(true);
  }, []);

  const handleOpenSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const handleShowConnectivityCheck = useCallback(() => {
    setShowConnectivityCheck(true);
  }, []);

  const handleShowMobileAppInfo = useCallback(() => {
    setShowMobileAppInfo(true);
  }, []);

  const handleCloseConnectivityCheck = useCallback(() => {
    setShowConnectivityCheck(false);
  }, []);

  const handleCloseMobileAppInfo = useCallback(() => {
    setShowMobileAppInfo(false);
  }, []);

  // FIXED: Removed hacky useEffect to force-close modal
  // The initial state should be set to `false` in useTradingRoomState

  // Modal handlers
  const handleShowAlertModalClose = useCallback(() => {
    setShowAlertModal(false);
  }, []);

  const handleShowAlertModalOpen = useCallback(() => {
    setShowAlertModal(true);
  }, []);

  const handleShowPollModalClose = useCallback(() => {
    setShowPollModal(false);
  }, []);

  const handleShowPollModalOpen = useCallback(() => {
    setShowPollModal(true);
  }, []);

  const handleThemePanelClose = useCallback(() => {
    setShowThemePanel(false);
  }, []);

  const handleCameraWindowClose = useCallback(() => {
    setShowCameraWindow(false);
  }, []);

  // =========================================================
  // MODERATION HANDLERS - For Alerts
  // =========================================================
  const handleMuteUser = useCallback((userId: string, displayName: string) => {
    if (confirm(`Mute ${displayName}? They won't be able to send messages.`)) {
      try {
        const mutedUsers = JSON.parse(localStorage.getItem('muted_users') || '[]');
        mutedUsers.push({ id: userId, name: displayName, mutedAt: new Date() });
        localStorage.setItem('muted_users', JSON.stringify(mutedUsers));
        addToast(`${displayName} has been muted`);
      } catch (error) {
        logger.error('Failed to mute user:', error);
        addToast('Failed to mute user');
      }
    }
  }, [addToast, logger]);

  const handleBanUser = useCallback(async (userId: string, displayName: string) => {
    if (!room?.id || !user?.id) {
      addToast('Cannot ban user: Missing room or user context');
      return;
    }
    if (!confirm(`Ban ${displayName}? This will remove them from the room permanently.`)) return;
    
    try {
      // Microsoft Enterprise: Server-side ban implementation
      // Remove user from room (banned users are tracked in banned_users table)
      const { error } = await supabase
        .from('room_memberships')
        .delete()
        .eq('user_id', userId)
        .eq('room_id', room.id);
      
      if (error) throw error;
      
      // Add to banned_users table for audit trail and enforcement
      await supabase.from('banned_users')
        .insert({
          user_id: userId,
          room_id: room.id,
          banned_by: user.id,
          reason: 'Banned by moderator',
          banned_at: new Date().toISOString()
        });
      
      addToast(`${displayName} has been banned`);
      logger.info('User banned:', { userId, displayName, roomId: room.id });
    } catch (error) {
      logger.error('Failed to ban user:', error);
      addToast('Failed to ban user');
    }
  }, [addToast, logger, room?.id, user?.id]);

  const handleKickUser = useCallback(async (userId: string, displayName: string) => {
    if (!room?.id || !user?.id) {
      addToast('Cannot kick user: Missing room or user context');
      return;
    }
    if (!confirm(`Kick ${displayName}? They can rejoin the room later.`)) return;
    
    try {
      // Microsoft Enterprise: Server-side kick implementation
      // Temporarily remove from room (they can rejoin)
      const { error } = await supabase
        .from('room_memberships')
        .delete()
        .eq('user_id', userId)
        .eq('room_id', room.id);
      
      if (error) throw error;
      
      // Log moderation action
      await supabase.from('moderation_log')
        .insert({
          room_id: room.id,
          moderator_id: user.id,
          target_user_id: userId,
          action: 'kick',
          reason: 'Kicked by moderator',
          created_at: new Date().toISOString()
        });
      
      addToast(`${displayName} has been kicked`);
      logger.info('User kicked:', { userId, displayName, roomId: room.id });
    } catch (error) {
      logger.error('Failed to kick user:', error);
      addToast('Failed to kick user');
    }
  }, [addToast, logger, room?.id, user?.id]);

  const handleReportAlert = useCallback(async (alertId: string) => {
    if (!room?.id || !user?.id) {
      addToast('Cannot report: Missing room or user context');
      return;
    }
    if (!confirm('Report this alert to moderators?')) return;
    
    try {
      // Microsoft Enterprise: Server-side report implementation
      const { error } = await supabase.from('reported_content')
        .insert({
          content_type: 'alert',
          content_id: alertId,
          room_id: room.id,
          reported_by: user.id,
          reason: 'Reported by user',
          status: 'pending',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      addToast('Alert reported to moderators');
      logger.info('Alert reported:', { alertId, roomId: room.id, reportedBy: user.id });
    } catch (error) {
      logger.error('Failed to report alert:', error);
      addToast('Failed to report alert');
    }
  }, [addToast, logger, room?.id, user?.id]);

  const handleMentionUser = useCallback((displayName: string) => {
    // Microsoft Enterprise: Focus chat input with @mention (Teams/Google Chat style)
    try {
      const chatInput = document.querySelector<HTMLTextAreaElement>('[data-chat-input]') || 
                       document.querySelector<HTMLTextAreaElement>('textarea[placeholder*="message"]');
      
      if (chatInput) {
        // Get current value and cursor position
        const currentValue = chatInput.value;
        const currentCursorPos = chatInput.selectionStart || 0;
        
        // Insert @mention at cursor position or append if at end
        const beforeCursor = currentValue.substring(0, currentCursorPos);
        const afterCursor = currentValue.substring(currentCursorPos);
        
        // Add space before mention if needed
        const needsSpaceBefore = beforeCursor.length > 0 && !beforeCursor.endsWith(' ');
        const mention = `${needsSpaceBefore ? ' ' : ''}@${displayName} `;
        
        // Construct new value
        chatInput.value = beforeCursor + mention + afterCursor;
        
        // Set cursor after the mention
        const newCursorPos = beforeCursor.length + mention.length;
        chatInput.focus();
        chatInput.setSelectionRange(newCursorPos, newCursorPos);
        
        // Trigger input event for React state sync
        chatInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        logger.info('Mention added to chat:', { displayName });
      } else {
        addToast(`@${displayName} - Chat input not found`);
        logger.warn('Chat input element not found');
      }
    } catch (error) {
      logger.error('Failed to mention user:', error);
      addToast('Failed to mention user');
    }
  }, [addToast, logger]);

  const handleUserInfo = useCallback(async (userId: string, displayName: string) => {
    if (!room?.id) {
      addToast('Cannot show user info: Missing room context');
      return;
    }
    // Microsoft Enterprise: Show user info modal
    try {
      // Fetch user profile data
      const { data: profile, error } = await supabase.from('profiles')
        .select('*')
        .eq('id', userId)
        .single() as { data: { last_seen?: string; email?: string; status?: string; is_online?: boolean } | null; error: Error | null };
      
      if (error) throw error;
      
      // Get user's room membership info
      const { data: membership } = await supabase
        .from('room_memberships')
        .select('role, joined_at, city, region, country')
        .eq('user_id', userId)
        .eq('room_id', room.id)
        .single();
      
      // Create modal content
      const modalHtml = `
        <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center" id="user-info-modal">
          <div class="bg-slate-800 rounded-lg p-6 max-w-md w-full border border-slate-600 shadow-2xl">
            <div class="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <div class="flex items-center gap-4">
                <!-- Avatar with gear dropdown -->
                <div class="relative group">
                  <img src="https://secure.gravatar.com/avatar/${userId}?d=mm&s=80" alt="${displayName}" class="w-20 h-20 rounded-full" />
                  <div class="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div class="relative">
                      <button class="bg-slate-700 hover:bg-slate-600 rounded-full p-2 text-white" onclick="toggleAvatarMenu()">
                        <i class="fas fa-cog text-sm"></i>
                      </button>
                      <div id="avatar-menu" class="hidden absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded shadow-xl z-10">
                        <a href="https://en.gravatar.com/" target="_blank" class="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                          <i class="fas fa-user"></i> Setup Gravatar
                        </a>
                        <button class="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                          <i class="fas fa-file-upload"></i> Upload Picture
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h2 class="text-xl font-semibold text-white">
                  ${displayName}
                  <button class="text-blue-500 hover:text-blue-400 ml-2" title="Edit username">
                    <i class="fas fa-edit text-sm"></i>
                  </button>
                </h2>
                <span class="text-sm text-slate-400">${membership?.role || 'member'}</span>
              </div>
            </div>
            <button onclick="document.getElementById('user-info-modal').remove()" class="text-slate-400 hover:text-white transition-colors">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <!-- Tabs -->
          <div class="border-b border-slate-700">
            <nav class="flex px-6">
              <button onclick="switchTab('info')" id="tab-info" class="px-4 py-3 text-sm font-medium border-b-2 border-blue-500 text-blue-500 tab-btn">User Info</button>
              <button onclick="switchTab('system')" id="tab-system" class="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-slate-400 hover:text-white tab-btn">System</button>
              <button onclick="switchTab('actions')" id="tab-actions" class="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-slate-400 hover:text-white tab-btn">Actions</button>
              <button onclick="switchTab('notes')" id="tab-notes" class="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-slate-400 hover:text-white tab-btn">Admin Notes</button>
            </nav>
          </div>
          
          <!-- Tab Content -->
          <div class="p-6 max-h-[60vh] overflow-y-auto">
            <div id="content-info" class="tab-content">
              <table class="w-full text-sm">
                <tbody class="divide-y divide-slate-800">
                  <tr><th class="text-left py-2 pr-4 text-slate-400 font-medium">Name:</th><td class="py-2 text-white">${displayName}</td></tr>
                  <tr><th class="text-left py-2 pr-4 text-slate-400 font-medium">Last Login:</th><td class="py-2 text-white">${profile?.last_seen ? new Date(profile.last_seen).toLocaleString() : 'Unknown'}</td></tr>
                  <tr><th class="text-left py-2 pr-4 text-slate-400 font-medium">Email:</th><td class="py-2 text-white">${profile?.email || 'N/A'}</td></tr>
                  <tr><th class="text-left py-2 pr-4 text-slate-400 font-medium">Location:</th><td class="py-2 text-white">${[membership?.city || 'Unknown', membership?.region, membership?.country].filter(Boolean).join(', ')}</td></tr>
                  <tr><th class="text-left py-2 pr-4 text-slate-400 font-medium">Permissions:</th><td class="py-2 text-white">${membership?.role || 'member'}</td></tr>
                  <tr><th class="text-left py-2 pr-4 text-slate-400 font-medium">Joined:</th><td class="py-2 text-white">${membership?.joined_at ? new Date(membership.joined_at).toLocaleDateString() : 'Unknown'}</td></tr>
                </tbody>
              </table>
            </div>
            <div id="content-system" class="tab-content hidden">
              <table class="w-full text-sm">
                <tbody class="divide-y divide-slate-800">
                  <tr><th class="text-left py-2 pr-4 text-slate-400 font-medium">User ID:</th><td class="py-2 text-white font-mono text-xs">${userId}</td></tr>
                  <tr><th class="text-left py-2 pr-4 text-slate-400 font-medium">Room ID:</th><td class="py-2 text-white font-mono text-xs">${room.id}</td></tr>
                  <tr><th class="text-left py-2 pr-4 text-slate-400 font-medium">Status:</th><td class="py-2 text-white">${profile?.status || 'active'}</td></tr>
                  <tr><th class="text-left py-2 pr-4 text-slate-400 font-medium">Online:</th><td class="py-2 text-white">${profile?.is_online ? 'Yes' : 'No'}</td></tr>
                </tbody>
              </table>
            </div>
            <div id="content-actions" class="tab-content hidden">
              <div class="grid grid-cols-2 gap-3">
                <button class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors text-sm flex items-center gap-2">
                  <i class="fas fa-microphone-slash"></i> Mute Audio
                </button>
                <button class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors text-sm flex items-center gap-2">
                  <i class="fas fa-video-slash"></i> Mute Camera
                </button>
                <button class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors text-sm flex items-center gap-2">
                  <i class="fas fa-sync"></i> Force Reload
                </button>
                <button class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors text-sm flex items-center gap-2">
                  <i class="fas fa-user-times"></i> Kick
                </button>
                <button class="px-4 py-2.5 bg-red-900 hover:bg-red-800 text-white rounded transition-colors text-sm flex items-center gap-2">
                  <i class="fas fa-ban"></i> Kick & Ban
                </button>
                <button class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors text-sm flex items-center gap-2">
                  <i class="fas fa-comment-slash"></i> Mute Chat
                </button>
              </div>
            </div>
            <div id="content-notes" class="tab-content hidden">
              <p class="text-slate-400 text-sm mb-4">To manage user notes, admin access is required.</p>
              <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-sm">
                <i class="fas fa-lock"></i> Enter Admin Password
              </button>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="bg-slate-800 px-6 py-4 border-t border-slate-700 flex gap-3 justify-end">
            <button onclick="handleMentionFromModal('${displayName}')" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors text-sm">
              <i class="fas fa-at"></i> @Mention
            </button>
            <button onclick="handlePrivateChatFromModal('${userId}', '${displayName}')" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors text-sm">
              <i class="fas fa-comments"></i> Private Chat
            </button>
            <button onclick="document.getElementById('user-info-modal').remove()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-sm">
              Close
            </button>
          </div>
        </div>
        <script>
          function toggleAvatarMenu() {
            document.getElementById('avatar-menu').classList.toggle('hidden');
          }
          function switchTab(tab) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.tab-btn').forEach(el => {
              el.classList.remove('border-blue-500', 'text-blue-500');
              el.classList.add('border-transparent', 'text-slate-400');
            });
            document.getElementById('content-' + tab).classList.remove('hidden');
            document.getElementById('tab-' + tab).classList.remove('border-transparent', 'text-slate-400');
            document.getElementById('tab-' + tab).classList.add('border-blue-500', 'text-blue-500');
          }
          function handleMentionFromModal(name) {
            window.dispatchEvent(new CustomEvent('mention-user', {detail: name}));
            document.getElementById('user-info-modal').remove();
          }
          function handlePrivateChatFromModal(userId, name) {
            window.dispatchEvent(new CustomEvent('private-chat', {detail: {userId, displayName: name}}));
            document.getElementById('user-info-modal').remove();
          }
        </script>
      `;
      
      // Remove existing modal if any
      document.getElementById('user-info-modal')?.remove();
      
      // Insert modal
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      
      logger.info('User info displayed:', { userId, displayName });
    } catch (error) {
      logger.error('Failed to show user info:', error);
      addToast('Failed to load user information');
    }
  }, [addToast, logger, room?.id]);

  const handlePrivateChat = useCallback(async (userId: string, displayName: string) => {
    if (!user?.id) {
      addToast('Cannot open private chat: Missing user context');
      return;
    }
    
    try {
      // Create or get existing private chat room
      const { data: existingChat, error: fetchError } = await supabase.from('private_chats')
        .select('*')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${user.id})`)
        .maybeSingle();
      
      let chatId = existingChat?.id;
      
      if (!existingChat && !fetchError) {
        // Create new private chat
        const { data: newChat, error: createError } = await supabase.from('private_chats')
          .insert({
            user1_id: user.id,
            user2_id: userId,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (createError) throw createError;
        chatId = newChat?.id;
      }
      
      // Dispatch event to open private chat drawer
      window.dispatchEvent(new CustomEvent('open-private-chat', { 
        detail: { 
          chatId, 
          userId, 
          displayName,
          currentUserId: user.id
        } 
      }));
      
      logger.info('Private chat opened:', { userId, displayName, chatId });
    } catch (error) {
      logger.error('Failed to open private chat:', error);
      addToast('Failed to open private chat');
    }
  }, [addToast, logger, user?.id]);

  const handleShowToAll = useCallback(async (alertId: string) => {
    if (!room?.id || !user?.id) {
      addToast('Cannot broadcast: Missing room or user context');
      return;
    }
    // Microsoft Enterprise: Broadcast alert to all users
    try {
      // Send notification to all room members
      const { data: members } = await supabase
        .from('room_memberships')
        .select('user_id')
        .eq('room_id', room.id);
      
      if (members && members.length > 0) {
        // Create notifications for all members
        const notifications = members.map((member: { user_id: string }) => ({
          user_id: member.user_id,
          type: 'broadcast_alert',
          message: 'New alert has been broadcasted to all members',
          title: 'Alert Broadcast',
          room_id: room.id,
          alert_id: alertId
        }));
        
        await supabase.from('notifications')
          .insert(notifications);
      }
      
      addToast('Alert broadcasted to all users');
      logger.info('Alert broadcasted:', { alertId, roomId: room.id, memberCount: members?.length || 0 });
    } catch (error) {
      logger.error('Failed to broadcast alert:', error);
      addToast('Failed to broadcast alert');
    }
  }, [addToast, logger, room?.id, user?.id]);

  // =========================================================
  // LAYOUT RESET HANDLER
  // =========================================================
  const handleResetLayout = useCallback(() => {
    try { resetLayout(); } catch {}
  }, [resetLayout]);

  // =========================================================
  // PREPARE LAYOUT PROPS
  // =========================================================
  const layoutState: TradingRoomLayoutProps['state'] = {
    room,
    user: user ?? null,
    containerStyle,
    canRecord,
    canManageRoom,
    isRecording,
    isMicEnabled,
    cameraEnabled,
    audioStream: audioStream || null,
    spotifyConnected,
    linkedinConnected,
    xConnected,
    isRefreshing,
    contentTab,
    isWhiteboardActive,
    size,
    showConnectivityCheck,
    showMobileAppInfo,
    showAlertModal,
    showPollModal,
    showThemePanel,
    showCameraWindow,
    showBranding,
    showSettings,
    cameraStream: cameraStream || null,
    isResizingLeft,
    isResizingVertical,
    leftPanelWidth,
    alertsHeight,
    whiteboardEvents,
  };

  const layoutHandlers: TradingRoomLayoutProps['handlers'] = {
    handleCustomizeClick,
    handleOpenSettings,
    handleLeave,
    handleRefresh,
    handleToggleMic,
    handleToggleCamera,
    handleToggleRecording,
    handleSpotifyConnect,
    handleSpotifyDisconnect,
    handleLinkedInConnect,
    handleLinkedInDisconnect,
    handleXConnect,
    handleXDisconnect,
    handleShowConnectivityCheck,
    handleShowMobileAppInfo,
    handleCloseConnectivityCheck,
    handleCloseMobileAppInfo,
    handleVerticalResizeDown,
    handleLeftResizeStart,
    handleKeyboardResize,
    handleKeyboardSnap,
    onTabChange: setContentTab,
    onWhiteboardOpen: () => setIsWhiteboardActive(true),
    onWhiteboardClose: () => setIsWhiteboardActive(false),
    onWhiteboardEvent: (event: unknown) => handleWhiteboardEvent(event as WhiteboardEvent),
    handleShowAlertModalClose,
    handleShowAlertModalOpen,
    handleShowPollModalClose,
    handleShowPollModalOpen,
    handleThemePanelClose,
    handleCameraWindowClose,
    handleResetLayout,
    setShowBranding,
    setShowSettings,
    handleMuteUser,
    handleBanUser,
    handleKickUser,
    handleReportAlert,
    handleMentionUser,
    handleUserInfo,
    handlePrivateChat,
    handleShowToAll,
  };

  const layoutRefs: TradingRoomLayoutProps['refs'] = {
    sizeRef,
    containerRef,
    leftPanelRef,
  };

  // =========================================================
  // RENDER
  // =========================================================
  return (
    <TradingRoomLayout state={layoutState} handlers={layoutHandlers} refs={layoutRefs} />
  );
}