/**
 * Screen Share Controller Hook - Microsoft Enterprise Standards
 * =========================================================
 * Manages screen sharing lifecycle with guaranteed cleanup
 */

import { useState, useCallback, useRef, useEffect } from 'react';

import { liveKitService } from '../../services/livekit';
import { useToastStore } from '../../store/toastStore';

import { MEDIA_CONSTRAINTS } from './constants';
import type { UseScreenShareControllerReturn } from './types';

export function useScreenShareController(): UseScreenShareControllerReturn {
  const [isSharing, setIsSharing] = useState(false);
  const { addToast } = useToastStore();
  
  // Track cleanup state and stream
  const isCleaningUp = useRef(false);
  const screenStream = useRef<MediaStream | null>(null);
  const trackPublished = useRef(false);

  // ============================================================================
  // SCREEN SHARE CONTROL
  // ============================================================================

  const startScreenShare = useCallback(async () => {
    if (isCleaningUp.current || isSharing) return;

    try {
      console.log('[ScreenShare] Starting screen share...');
      
      // Request screen share from browser
      const stream = await navigator.mediaDevices.getDisplayMedia(MEDIA_CONSTRAINTS.SCREEN_SHARE);
      
      if (!stream) {
        throw new Error('No screen share stream obtained');
      }

      screenStream.current = stream;
      
      // Publish to LiveKit
      const room = liveKitService.getRoom();
      if (room) {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          await room.localParticipant.publishTrack(videoTrack, {
            name: 'screen_share',
            // @ts-expect-error - screen_share is a valid source but not in the type definition
            source: 'screen_share',
          });
          trackPublished.current = true;
          console.log('[ScreenShare] Track published to LiveKit');
        }
      }

      // Microsoft Pattern: Listen for user stopping share via browser UI
      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        console.log('[ScreenShare] User stopped sharing via browser UI');
        stopScreenShare();
      });

      setIsSharing(true);
      addToast('Screen sharing started');
      console.log('[ScreenShare] Screen share started successfully');
    } catch (error) {
      console.error('[ScreenShare] Failed to start screen share:', error);
      
      // Clean up any partial state
      if (screenStream.current) {
        screenStream.current.getTracks().forEach(track => track.stop());
        screenStream.current = null;
      }
      
      setIsSharing(false);
      addToast('Failed to start screen sharing');
    }
  }, [isSharing, addToast]);

  const stopScreenShare = useCallback(async () => {
    if (isCleaningUp.current) return;

    try {
      console.log('[ScreenShare] Stopping screen share...');

      // Unpublish from LiveKit
      if (trackPublished.current) {
        const room = liveKitService.getRoom();
        if (room) {
          const publications = Array.from(room.localParticipant.trackPublications.values());
          const screenTrack = publications.find((pub) => (pub as unknown as Record<string, unknown>).trackName === 'screen_share');
          
          if (screenTrack?.track) {
            await room.localParticipant.unpublishTrack(screenTrack.track);
            console.log('[ScreenShare] Track unpublished from LiveKit');
          }
        }
        trackPublished.current = false;
      }

      // Stop all tracks
      if (screenStream.current) {
        screenStream.current.getTracks().forEach(track => {
          track.stop();
          console.log('[ScreenShare] Track stopped:', track.kind);
        });
        screenStream.current = null;
      }

      setIsSharing(false);
      addToast('Screen sharing stopped');
      console.log('[ScreenShare] Screen share stopped successfully');
    } catch (error) {
      console.error('[ScreenShare] Error stopping screen share:', error);
      // Force cleanup even on error
      if (screenStream.current) {
        screenStream.current.getTracks().forEach(track => track.stop());
        screenStream.current = null;
      }
      setIsSharing(false);
    }
  }, [addToast]);

  const toggleScreenShare = useCallback(async () => {
    if (isSharing) {
      await stopScreenShare();
    } else {
      await startScreenShare();
    }
  }, [isSharing, startScreenShare, stopScreenShare]);

  // ============================================================================
  // CLEANUP
  // ============================================================================

  const cleanup = useCallback(() => {
    console.log('[ScreenShare] Cleanup initiated');
    isCleaningUp.current = true;

    // Stop screen share if active
    if (screenStream.current) {
      screenStream.current.getTracks().forEach(track => track.stop());
      screenStream.current = null;
    }

    // Unpublish from LiveKit
    if (trackPublished.current) {
      const room = liveKitService.getRoom();
      if (room) {
        const publications = Array.from(room.localParticipant.trackPublications.values());
        const screenTrack = publications.find((pub) => (pub as unknown as Record<string, unknown>).trackName === 'screen_share');
        
        if (screenTrack?.track) {
          room.localParticipant.unpublishTrack(screenTrack.track).catch(console.error);
        }
      }
      trackPublished.current = false;
    }

    setIsSharing(false);
  }, []);

  // Microsoft Pattern: Guaranteed cleanup on unmount and route change
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isSharing,
    toggleScreenShare,
    cleanup,
  };
}
