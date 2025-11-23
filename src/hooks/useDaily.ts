/**
 * React Hook for Daily.co Integration
 * Easy-to-use hook for video/audio in React components
 */

import { useState, useEffect, useCallback } from 'react';
import type { DailyServiceState } from '../services/daily';
import { dailyService } from '../services/daily';
import type { DailyCall } from '@daily-co/daily-js';

export interface UseDailyOptions {
  roomUrl?: string;
  token?: string;
  userName?: string;
  autoJoin?: boolean;
  enableAudio?: boolean;
  enableVideo?: boolean;
}

export interface UseDailyReturn {
  // Connection state
  isConnecting: boolean;
  isConnected: boolean;
  error?: string;
  
  // Call object
  callObject?: DailyCall;
  
  // Actions
  join: () => Promise<void>;
  leave: () => Promise<void>;
  toggleMicrophone: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
  
  // State
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
  isScreenSharing: boolean;
  
  // Participants
  participants: DailyServiceState['participants'];
  localParticipant?: DailyServiceState['localParticipant'];
}

export function useDaily(options: UseDailyOptions = {}): UseDailyReturn {
  const [state, setState] = useState<DailyServiceState>({
    isConnecting: false,
    isConnected: false,
    participants: [],
  });
  
  const [isMicEnabled, setIsMicEnabled] = useState(options.enableAudio !== false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(options.enableVideo !== false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Join room
  const join = useCallback(async () => {
    if (!options.roomUrl) {
      throw new Error('Room URL is required');
    }

    try {
      await dailyService.connect(options.roomUrl, options.token, {
        userName: options.userName,
        enableAudio: options.enableAudio,
        enableVideo: options.enableVideo,
      });
      
      // Update state
      setState(dailyService.getConnectionState());
    } catch (error) {
      console.error('[useDaily] Join error:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to join',
      }));
    }
  }, [options.roomUrl, options.token, options.userName, options.enableAudio, options.enableVideo]);

  // Leave room
  const leave = useCallback(async () => {
    try {
      await dailyService.disconnect();
      setState({
        isConnecting: false,
        isConnected: false,
        participants: [],
      });
    } catch (error) {
      console.error('[useDaily] Leave error:', error);
    }
  }, []);

  // Toggle microphone
  const toggleMicrophone = useCallback(async () => {
    try {
      const newState = !isMicEnabled;
      await dailyService.setMicrophoneEnabled(newState);
      setIsMicEnabled(newState);
    } catch (error) {
      console.error('[useDaily] Toggle microphone error:', error);
    }
  }, [isMicEnabled]);

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    try {
      const newState = !isCameraEnabled;
      await dailyService.setCameraEnabled(newState);
      setIsCameraEnabled(newState);
    } catch (error) {
      console.error('[useDaily] Toggle camera error:', error);
    }
  }, [isCameraEnabled]);

  // Start screen share
  const startScreenShare = useCallback(async () => {
    try {
      await dailyService.startScreenShare();
      setIsScreenSharing(true);
    } catch (error) {
      console.error('[useDaily] Start screen share error:', error);
    }
  }, []);

  // Stop screen share
  const stopScreenShare = useCallback(async () => {
    try {
      await dailyService.stopScreenShare();
      setIsScreenSharing(false);
    } catch (error) {
      console.error('[useDaily] Stop screen share error:', error);
    }
  }, []);

  // Auto-join if enabled
  useEffect(() => {
    if (options.autoJoin && options.roomUrl && !state.isConnected) {
      join();
    }
  }, [options.autoJoin, options.roomUrl, state.isConnected, join]);

  // Poll for state updates
  useEffect(() => {
    if (!state.isConnected) return;

    const interval = setInterval(() => {
      setState(dailyService.getConnectionState());
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.isConnected) {
        dailyService.disconnect();
      }
    };
  }, [state.isConnected]);

  return {
    isConnecting: state.isConnecting,
    isConnected: state.isConnected,
    error: state.error,
    callObject: dailyService.getCallObject(),
    join,
    leave,
    toggleMicrophone,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    isMicEnabled,
    isCameraEnabled,
    isScreenSharing,
    participants: state.participants,
    localParticipant: state.localParticipant,
  };
}
