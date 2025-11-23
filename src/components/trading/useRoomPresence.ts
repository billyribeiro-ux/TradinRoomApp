/**
 * Room Presence Hook - Microsoft Enterprise Standards
 * =========================================================
 * Manages user presence, typing indicators, and room activity
 * Handles real-time presence updates and user status
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

import { liveKitService } from '../../services/livekit';
import type { RemoteParticipant } from 'livekit-client';
import { loggerFactory } from '../infrastructure';

interface PresenceState {
  readonly connectedUsers: readonly string[];
  readonly typingUsers: readonly string[];
  readonly isUserTyping: boolean;
  readonly lastActivity: Date | null;
}

interface UseRoomPresenceProps {
  readonly roomId: string;
  readonly userId: string;
}

export interface UseRoomPresenceReturn {
  readonly state: PresenceState;
  readonly setTyping: (isTyping: boolean) => void;
  readonly broadcastPresence: () => void;
}

export function useRoomPresence({ roomId, userId }: UseRoomPresenceProps): UseRoomPresenceReturn {
  const logger = useMemo(() => loggerFactory.create('RoomPresence'), []);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  const [state, setState] = useState<PresenceState>(() => ({
    connectedUsers: [],
    typingUsers: [],
    isUserTyping: false,
    lastActivity: null,
  }));

  // Handle presence data from LiveKit
  const handlePresenceData = useCallback((data: Uint8Array, _participant?: RemoteParticipant) => {
    try {
      const presence = JSON.parse(new TextDecoder().decode(data));
      
      if (presence.type === 'presence') {
        setState(prev => ({
          ...prev,
          connectedUsers: presence.users || [],
          lastActivity: new Date(),
        }));
      } else if (presence.type === 'typing') {
        setState(prev => ({
          ...prev,
          typingUsers: presence.users || [],
        }));
      }
    } catch (error) {
      logger.debug(`Failed to parse presence data: ${error}`);
    }
  }, [logger]);

  // Set up presence subscription
  useEffect(() => {
    const room = liveKitService.getRoom();
    if (!room) return;

    room.on('dataReceived', handlePresenceData);
    
    // Initial presence broadcast
    broadcastPresence();
    
    return () => {
      room.off('dataReceived', handlePresenceData);
    };
  }, [roomId, userId, handlePresenceData]);

  // Set typing status
  const setTyping = useCallback((isTyping: boolean) => {
    if (isTyping === state.isUserTyping) return;
    
    setState(prev => ({ ...prev, isUserTyping: isTyping }));
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (isTyping) {
      // Auto-stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
      }, 3000);
    }
    
    // Broadcast typing status
    const room = liveKitService.getRoom();
    if (room) {
      const typingData = {
        type: 'typing',
        userId,
        isTyping,
        timestamp: Date.now(),
      };
      
      room.localParticipant.publishData(
        new TextEncoder().encode(JSON.stringify(typingData)),
        { reliable: false } // Typing indicators don't need guaranteed delivery
      );
    }
  }, [state.isUserTyping, userId]);

  // Broadcast presence to room
  const broadcastPresence = useCallback(() => {
    const room = liveKitService.getRoom();
    if (!room) return;
    
    const presenceData = {
      type: 'presence',
      userId,
      status: 'online',
      timestamp: Date.now(),
    };
    
    room.localParticipant.publishData(
      new TextEncoder().encode(JSON.stringify(presenceData)),
      { reliable: true }
    );
    
    setState(prev => ({ ...prev, lastActivity: new Date() }));
  }, [userId]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    state,
    setTyping,
    broadcastPresence,
  };
}
