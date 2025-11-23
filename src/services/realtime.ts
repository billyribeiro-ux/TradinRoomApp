// src/services/realtime.ts
// ──────────────────────────────────────────────
// Real-time subscription management for Supabase
// ──────────────────────────────────────────────
import { supabase } from '../lib/supabase';
import { useRoomStore } from '../store/roomStore';
import type { ChatMessage, Alert, MediaTrack } from '../types/database.types';

// ──────────────────────────────────────────────
// Real-time subscription management
// ──────────────────────────────────────────────

// Enterprise standard: Type-safe channel management
// Using unknown for channels since Supabase RealtimeChannel type is complex
const activeChannels: Map<string, ReturnType<typeof supabase.channel>> = new Map();

export function subscribeToRoomChat(roomId: string) {
  if (!roomId) return;
  
  const channelName = `room-chat-${roomId}`;
  
  // Remove existing channel if it exists
  const existingChannel = activeChannels.get(channelName);
  if (existingChannel) {
    supabase.removeChannel(existingChannel);
  }
  
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chatmessages',
        filter: `room_id=eq.${roomId}`
      },
      (payload: { eventType: string; new: ChatMessage; old: ChatMessage }) => {
        // Enterprise standard: Environment-based logging (dev only)
        if (import.meta.env.DEV) {
          console.debug('[subscribeToRoomChat] Received:', payload);
        }
        
        const { setMessages } = useRoomStore.getState();
        
        const { messages: currentMessages } = useRoomStore.getState();
        
        if (payload.eventType === 'INSERT') {
          // Enterprise standard: Fetch complete message with user data via JOIN
          const incompleteMessage = payload.new as ChatMessage;
          const exists = currentMessages.some((msg) => msg.id === incompleteMessage.id);
          if (!exists) {
            // Fetch complete message with user data
            // Use async/await instead of Promise chain to avoid PromiseLike issues
            (async () => {
              try {
                const { data: completeMessage, error } = await supabase
                  .from('chatmessages')
                  .select('*, user:users!chatmessages_user_id_fkey(id, display_name, email)')
                  .eq('id', incompleteMessage.id)
                  .single();
                
                if (completeMessage && !error) {
                  const { messages: latestMessages } = useRoomStore.getState();
                  // Check again to prevent race condition duplicates
                  if (!latestMessages.some((msg) => msg.id === completeMessage.id)) {
                    setMessages([...latestMessages, completeMessage]);
                  }
                } else {
                  // Fallback: Use incomplete message if fetch fails
                  setMessages([...currentMessages, incompleteMessage]);
                }
              } catch (err) {
                if (import.meta.env.DEV) {
                  console.error('[subscribeToRoomChat] Failed to fetch complete message:', err);
                }
                // Fallback: Use incomplete message
                setMessages([...currentMessages, incompleteMessage]);
              }
            })();
          }
        } else if (payload.eventType === 'UPDATE') {
          // Fetch updated message with user data
          const updatedIncomplete = payload.new as ChatMessage;
          // Use async/await instead of Promise chain
          (async () => {
            try {
              const { data: completeMessage, error } = await supabase
                .from('chatmessages')
                .select('*, user:users!chatmessages_user_id_fkey(id, display_name, email)')
                .eq('id', updatedIncomplete.id)
                .single();
              
              if (completeMessage && !error) {
                const { messages: latestMessages } = useRoomStore.getState();
                setMessages(latestMessages.map((msg) => 
                  msg.id === completeMessage.id ? completeMessage : msg
                ));
              } else {
                // Fallback: Use incomplete message
                const { messages: latestMessages } = useRoomStore.getState();
                setMessages(latestMessages.map((msg) => 
                  msg.id === updatedIncomplete.id ? updatedIncomplete : msg
                ));
              }
            } catch (err) {
              if (import.meta.env.DEV) {
                console.error('[subscribeToRoomChat] Failed to fetch updated message:', err);
              }
              // Fallback: Use incomplete message
              const { messages: latestMessages } = useRoomStore.getState();
              setMessages(latestMessages.map((msg) => 
                msg.id === updatedIncomplete.id ? updatedIncomplete : msg
              ));
            }
          })();
        } else if (payload.eventType === 'DELETE') {
          setMessages(currentMessages.filter((msg) => msg.id !== payload.old.id));
        }
      }
    )
    .subscribe();
  
  activeChannels.set(channelName, channel);
  if (import.meta.env.DEV) {
    console.debug('[subscribeToRoomChat] Subscribed to:', channelName);
  }
}

/**
 * Subscribe to real-time alert updates for a specific room
 * FIXED: Changed from subscribeToTenantAlerts() which filtered by non-existent tenant_id
 * Database schema confirms alerts table has room_id foreign key, not tenant_id
 */
export function subscribeToRoomAlerts(roomId: string) {
  if (!roomId) return;
  
  const channelName = `room-alerts-${roomId}`;
  
  // Remove existing channel if it exists
  const existingChannel = activeChannels.get(channelName);
  if (existingChannel) {
    supabase.removeChannel(existingChannel);
  }
  
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'alerts',
        filter: `room_id=eq.${roomId}`  // FIXED: Changed from tenant_id to room_id
      },
      (payload: any) => {
        // Enterprise standard: Environment-based logging (dev only)
        if (import.meta.env.DEV) {
          const newAlert = payload.new as Alert | undefined;
          const oldAlert = payload.old as Alert | undefined;
          console.debug('[subscribeToRoomAlerts] Received real-time alert update:', {
            eventType: payload.eventType,
            alertId: newAlert?.id || oldAlert?.id,
            roomId: newAlert?.room_id || oldAlert?.room_id
          });
        }
        
        const { setAlerts } = useRoomStore.getState();
        const { alerts: currentAlerts } = useRoomStore.getState();
        
        if (payload.eventType === 'INSERT') {
          // Enterprise standard: Prevent duplicates (optimistic updates + real-time can cause duplicates)
          const newAlert = payload.new as Alert;
          const exists = currentAlerts.some((alert) => alert.id === newAlert.id);
          if (!exists) {
            if (import.meta.env.DEV) {
              console.debug('[subscribeToRoomAlerts] Adding new alert:', newAlert.id);
            }
            setAlerts([...currentAlerts, newAlert]);
          }
        } else if (payload.eventType === 'UPDATE') {
          if (import.meta.env.DEV) {
            console.debug('[subscribeToRoomAlerts] Updating alert:', payload.new?.id);
          }
          setAlerts(currentAlerts.map((alert) => 
            alert.id === payload.new.id ? payload.new as Alert : alert
          ));
        } else if (payload.eventType === 'DELETE') {
          if (import.meta.env.DEV) {
            console.debug('[subscribeToRoomAlerts] Deleting alert:', payload.old?.id);
          }
          setAlerts(currentAlerts.filter((alert) => alert.id === payload.old.id));
        }
      }
    )
    .subscribe((status: any) => {
      // Enterprise standard: Error handling for subscription failures
      if (status === 'SUBSCRIBED') {
        if (import.meta.env.DEV) {
          console.debug('[subscribeToRoomAlerts] Successfully subscribed');
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error('[subscribeToRoomAlerts] Subscription error:', status);
        // TODO: Implement reconnection logic
      } else if (status === 'CLOSED') {
        // Normal closure during unmount - no error logging needed
        if (import.meta.env.DEV) {
          console.debug('[subscribeToRoomAlerts] Subscription closed normally');
        }
      }
    });
  
  activeChannels.set(channelName, channel);
  if (import.meta.env.DEV) {
    console.debug('[subscribeToRoomAlerts] Subscribed to room alerts:', { channelName, roomId });
  }
}

/**
 * @deprecated Use subscribeToRoomAlerts(roomId) instead. Alerts table uses room_id, not tenant_id.
 * Kept for backward compatibility during migration.
 */
export function subscribeToTenantAlerts(_tenantId: string) {
  // Enterprise standard: Only warn in development
  if (import.meta.env.DEV) {
    console.warn('[subscribeToTenantAlerts] DEPRECATED - Use subscribeToRoomAlerts(roomId) instead. Alerts table has room_id, not tenant_id.');
  }
  // Return early - this subscription would never receive updates since tenant_id doesn't exist
  return;
}

export function subscribeToRoomTracks(roomId: string, _includeCleanup: boolean = false) {
  if (!roomId) return;
  
  const channelName = `room-tracks-${roomId}`;
  
  // Remove existing channel if it exists
  const existingChannel = activeChannels.get(channelName);
  if (existingChannel) {
    supabase.removeChannel(existingChannel);
  }
  
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'mediatrack',
        filter: `room_id=eq.${roomId}`
      },
      (payload: any) => {
        // Enterprise standard: Environment-based logging (dev only)
        if (import.meta.env.DEV) {
          console.debug('[subscribeToRoomTracks] Received:', payload);
        }
        
        const { setTracks } = useRoomStore.getState();
        
        const { tracks: currentTracks } = useRoomStore.getState();
        
        if (payload.eventType === 'INSERT') {
          setTracks([...currentTracks, payload.new as MediaTrack]);
        } else if (payload.eventType === 'UPDATE') {
          setTracks(currentTracks.map((track) => 
            track.id === payload.new.id ? payload.new as MediaTrack : track
          ));
        } else if (payload.eventType === 'DELETE') {
          setTracks(currentTracks.filter((track) => track.id !== payload.old.id));
        }
      }
    )
    .subscribe();
  
  activeChannels.set(channelName, channel);
  if (import.meta.env.DEV) {
    console.debug('[subscribeToRoomTracks] Subscribed to:', channelName);
  }
}

export function unsubscribeFromRoom() {
  // Enterprise standard: Environment-based logging (dev only)
  if (import.meta.env.DEV) {
    console.debug('[unsubscribeFromRoom] Unsubscribing from all channels');
  }
  
  // Unsubscribe from all active channels
  for (const [channelName, channel] of activeChannels) {
    if (import.meta.env.DEV) {
      console.debug('[unsubscribeFromRoom] Removing channel:', channelName);
    }
    supabase.removeChannel(channel);
  }
  
  // Clear the active channels map
  activeChannels.clear();
}

export function unsubscribeFromChannel(channelName: string) {
  const channel = activeChannels.get(channelName);
  if (channel) {
    if (import.meta.env.DEV) {
      console.debug('[unsubscribeFromChannel] Removing channel:', channelName);
    }
    supabase.removeChannel(channel);
    activeChannels.delete(channelName);
  }
}

// ──────────────────────────────────────────────
// Utility functions
// ──────────────────────────────────────────────

export function getActiveChannels(): string[] {
  return Array.from(activeChannels.keys());
}

export function isChannelActive(channelName: string): boolean {
  return activeChannels.has(channelName);
}

export function getChannelCount(): number {
  return activeChannels.size;
}