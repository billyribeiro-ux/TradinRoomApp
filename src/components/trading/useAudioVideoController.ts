/**
 * Audio/Video Controller Hook - Microsoft Enterprise Standards
 * =========================================================
 * Manages microphone and camera state with proper cleanup
 */

import { useState, useCallback, useRef, useEffect } from 'react';

import { audioService } from '../../services/audioService';
import { cameraService } from '../../services/cameraService';
import { useToastStore } from '../../store/toastStore';

import type { UseAudioVideoControllerReturn } from './types';

export function useAudioVideoController(): UseAudioVideoControllerReturn {
  // Microsoft Pattern: Mic starts muted by default
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const { addToast } = useToastStore();
  
  // Track cleanup state
  const isCleaningUp = useRef(false);
  const isInitialized = useRef(false);
  const micStream = useRef<MediaStream | null>(null);
  const cameraStream = useRef<MediaStream | null>(null);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  useEffect(() => {
    const initServices = async () => {
      if (isInitialized.current) return;
      
      try {
        await audioService.initialize();
        isInitialized.current = true;
        console.log('[AudioVideo] Services initialized');
      } catch (error) {
        console.warn('[AudioVideo] Service initialization failed (may require user gesture):', error);
        // Don't block - will try again on first toggle
      }
    };
    
    void initServices();
  }, []);

  // ============================================================================
  // MICROPHONE CONTROL
  // ============================================================================

  const toggleMic = useCallback(async () => {
    if (isCleaningUp.current) return;

    try {
      // Initialize on first use if not already done (handles case where init failed due to autoplay policy)
      if (!isInitialized.current) {
        try {
          await audioService.initialize();
          isInitialized.current = true;
        } catch (initError) {
          console.debug('[AudioVideo] Late initialization failed:', initError);
          // Continue anyway - startMicrophone will handle its own context
        }
      }

      if (isMicEnabled) {
        // Mute microphone
        audioService.stopMicrophone();
        micStream.current = null;
        setIsMicEnabled(false);
        console.log('[AudioVideo] Microphone muted');
      } else {
        // Unmute microphone - requires explicit user action
        await audioService.startMicrophone();
        micStream.current = audioService.getStream() || null;
        setIsMicEnabled(true);
        console.log('[AudioVideo] Microphone enabled');
      }
    } catch (error) {
      console.error('[AudioVideo] Microphone toggle failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle microphone';
      addToast(errorMessage.includes('Permission denied') 
        ? 'Microphone permission denied. Please allow microphone access.'
        : 'Failed to toggle microphone. Please check your microphone settings.');
      setIsMicEnabled(false);
    }
  }, [isMicEnabled, addToast]);

  // ============================================================================
  // CAMERA CONTROL
  // ============================================================================

  const toggleCamera = useCallback(async () => {
    if (isCleaningUp.current) return;

    try {
      if (isCameraEnabled) {
        // Disable camera
        cameraService.stopCamera();
        cameraStream.current = null;
        setIsCameraEnabled(false);
        console.log('[AudioVideo] Camera disabled');
      } else {
        // Enable camera
        await cameraService.startCamera();
        cameraStream.current = cameraService.getStream() || null;
        setIsCameraEnabled(true);
        console.log('[AudioVideo] Camera enabled');
      }
    } catch (error) {
      console.error('[AudioVideo] Camera toggle failed:', error);
      addToast('Failed to toggle camera');
      setIsCameraEnabled(false);
    }
  }, [isCameraEnabled, addToast]);

  // ============================================================================
  // CLEANUP
  // ============================================================================

  const cleanup = useCallback(() => {
    console.log('[AudioVideo] Cleanup initiated');
    isCleaningUp.current = true;

    // Stop microphone
    if (micStream.current) {
      audioService.stopMicrophone();
      micStream.current = null;
    }

    // Stop camera
    if (cameraStream.current) {
      cameraService.stopCamera();
      cameraStream.current = null;
    }

    setIsMicEnabled(false);
    setIsCameraEnabled(false);
  }, []);

  // Microsoft Pattern: Guaranteed cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isMicEnabled,
    isCameraEnabled,
    toggleMic,
    toggleCamera,
    cleanup,
  };
}
