/**
 * TradingRoomWrapper.tsx
 * Wrapper component that handles routing and room fetching for TradingRoom
 * Gets roomId from URL params and fetches room data before rendering TradingRoom
 * 
 * FIXED: Memoized room object to prevent infinite re-renders
 */

import { Spinner } from '@fluentui/react-components';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';


import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import type { Room, Alert, ChatMessage } from '../../types/database.types';

import { TradingRoom } from './TradingRoom';

export function TradingRoomWrapper() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user, initialized } = useAuthStore();
  const [roomData, setRoomData] = useState<Room | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  
  // Microsoft Pattern: Pre-load data to eliminate scroll delay
  const [initialAlerts, setInitialAlerts] = useState<Alert[]>([]);
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);

  // Fetch room data when roomId changes (clean version - no cache dependency)
  // Microsoft Pattern: Wait for auth initialization before loading room
  useEffect(() => {
    // CRITICAL: Wait for auth to fully initialize before attempting room operations
    // This prevents race conditions on page refresh where user is temporarily undefined
    if (!initialized) {
      return;
    }

    if (!roomId || !user) {
      setLoading(false);
      setRoomData(undefined);
      return;
    }

    async function loadRoom() {
      if (!user || !roomId) {
        setError('User or room ID not available');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(undefined);
        setRoomData(undefined);

        // Fetch directly from database - no cache dependency
        const { data, error: fetchError } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', roomId)
          .single();

        if (fetchError) {
          throw new Error(`Failed to load room: ${fetchError.message}`);
        }

        if (data) {
          setRoomData(data as Room);
          
          // Microsoft Pattern: Pre-load alerts and messages for instant scroll
          // This eliminates the 1-2 second delay on room load
          
          try {
            // Load alerts
            const { data: alertsData, error: alertsError } = await supabase
              .from('alerts')
              .select('*')
              .eq('room_id', roomId)
              .order('created_at', { ascending: true });
            
            if (alertsError) {
              console.error('[TradingRoomWrapper] Failed to load alerts:', alertsError);
            } else {
              setInitialAlerts(alertsData || []);
            }
            
            // Load messages (note: table name is 'chatmessages' in Supabase, not 'chat_messages')
            const { data: messagesData, error: messagesError } = await supabase
              .from('chatmessages')
              .select('*')
              .eq('room_id', roomId)
              .order('created_at', { ascending: true });
            
            if (messagesError) {
              console.error('[TradingRoomWrapper] Failed to load messages:', messagesError);
            } else {
              setInitialMessages((messagesData || []) as ChatMessage[]);
            }
          } catch (preloadError) {
            console.error('[TradingRoomWrapper] Pre-load error:', preloadError);
            // Don't fail the entire load if pre-load fails
          }
        } else {
          throw new Error('Room not found');
        }
      } catch (err) {
        console.error('[TradingRoomWrapper] Error loading room:', err);
        setError(err instanceof Error ? err.message : 'Failed to load room');
        setRoomData(undefined);
      } finally {
        setLoading(false);
      }
    }

    loadRoom();
  }, [roomId, user, initialized]);

  // 🔥 CRITICAL FIX: Memoize room object to prevent infinite re-renders
  // Only create new reference when roomData.id actually changes
  const room = useMemo(() => roomData, [roomData?.id]);

  // Handle leave - navigate back to room selector
  const handleLeave = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Loading state - wait for auth AND room data
  // Microsoft Pattern: Show appropriate loading message for current state
  if (!initialized || loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#111827',
        }}
      >
        <Spinner label={!initialized ? "Authenticating..." : "Loading room..."} />
      </div>
    );
  }

  // Error state
  if (error || !room) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#111827',
          color: '#fff',
          gap: '1rem',
        }}
      >
        <p style={{ fontSize: '1.2rem', margin: 0 }}>{error || 'Room not found'}</p>
        <button
          onClick={handleLeave}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  // Render TradingRoom with memoized room data and pre-loaded content
  return (
    <TradingRoom 
      room={room} 
      onLeave={handleLeave}
      initialAlerts={initialAlerts}
      initialMessages={initialMessages}
    />
  );
}