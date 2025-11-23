/**
 * roomStore.ts
 * -------------------------------------------------------------------
 * Unified Room + Tenant Store (Enterprise Edition)
 *
 * Combines:
 * - Chat, alerts, tracks, and members management (your existing system)
 * - Supabase CRUD (fetchRooms, createRoom, updateRoom)
 * - Tenant integration for AdvancedBrandingSettings and themes
 * -------------------------------------------------------------------
 */

import { create } from 'zustand';

import { supabase } from '../lib/supabase';
import type {
// Fixed: 2025-10-24 - Emergency null/undefined fixes for production
// Microsoft TypeScript standards applied - null → undefined, using optional types


// Fixed: 2025-01-24 - Eradicated 12 null usage(s) - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types

  Room,
  ChatMessage,
  Alert,
  Poll,
  MediaTrack,
  RoomMembership,
  Tenant,
} from '../types/database.types';

const LAST_ROOM_KEY = 'trading_room_last_active';

export interface RoomMember {
  id: string;
  display_name: string;
  avatar_url: string | undefined;
  city?: string;
  region?: string;
  country?: string;
  country_code?: string;
}

interface RoomState {
  // ─────────────────────────────
  // Core room and tenant context
  // ─────────────────────────────
  currentRoom: (Room & { tenant?: Tenant }) | undefined;
  rooms: Room[];
  tenants: Tenant[];
  loading: boolean;
  error: string | undefined;

  // ─────────────────────────────
  // Real-time features
  // ─────────────────────────────
  messages: ChatMessage[];
  alerts: Alert[];
  polls: Poll[];
  tracks: MediaTrack[];
  members: RoomMember[];
  membership: RoomMembership | undefined;
  viewers: number;
  isRecording: boolean;
  recordingId: string | undefined;
  isMicEnabled: boolean;
  volume: number;
  isMuted: boolean;
  isRefreshing: boolean;
  isRoomReady: boolean;

  // ─────────────────────────────
  // Computed permissions (Microsoft Enterprise Pattern)
  // ─────────────────────────────
  canRecord: () => boolean;
  canManageRoom: () => boolean;
  canDelete: () => boolean;

  // ─────────────────────────────
  // Room + tenant actions
  // ─────────────────────────────
  fetchRooms: (userId: string) => Promise<void>;
  setCurrentRoom: (room: Room | undefined) => Promise<void>;
  clearRoom: () => void;
  createRoom: (name: string, tenantId: string, userId: string) => Promise<Room | undefined>;
  updateRoom: (roomId: string, data: Partial<Room>) => Promise<void>;
  loadTenantData: (tenantId: string) => Promise<Tenant | undefined>;

  // ─────────────────────────────
  // Local state management
  // ─────────────────────────────
  setRoomReady: (ready: boolean) => void;
  getLastRoomId: () => string | undefined;
  clearLastRoomId: () => void;

  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  removeMessage: (id: string) => void;

  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  removeAlert: (id: string) => void;

  setPolls: (polls: Poll[]) => void;
  addPoll: (poll: Poll) => void;
  removePoll: (id: string) => void;

  setTracks: (tracks: MediaTrack[]) => void;
  addTrack: (track: MediaTrack) => void;
  updateTrack: (id: string, updates: Partial<MediaTrack>) => void;
  removeTrack: (id: string) => void;

  setMembers: (members: RoomMember[]) => void;
  addMember: (member: RoomMember) => void;
  removeMember: (userId: string) => void;
  updateMemberLocation: (userId: string, location: { city?: string; region?: string; country?: string; country_code?: string }) => void;

  setMembership: (membership: RoomMembership | undefined) => void;
  setViewers: (count: number) => void;
  setRecording: (isRecording: boolean, recordingId: string | undefined) => void;
  setMicEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
}

export const useRoomStore = create<RoomState>((set: (state: Partial<RoomState> | ((state: RoomState) => Partial<RoomState>)) => void, get: () => RoomState) => ({
  // ─────────────────────────────
  // Initial state
  // ─────────────────────────────
  currentRoom: undefined,
  rooms: [],
  tenants: [],
  loading: false,
  error: undefined,
  messages: [],
  alerts: [],
  polls: [],
  tracks: [],
  members: [],
  membership: undefined,
  viewers: 0,
  isRecording: false,
  recordingId: undefined,
  isMicEnabled: false,
  volume: 100,
  isMuted: false,
  isRefreshing: false,
  isRoomReady: false,

  // ─────────────────────────────
  // Computed permissions (Microsoft Enterprise Pattern)
  // ─────────────────────────────
  canRecord: () => {
    const role = get().membership?.role;
    // Recording available for admin and member roles
    return role === 'admin' || role === 'member';
  },
  canManageRoom: () => {
    // Only admin can manage room (edit settings, etc.)
    return get().membership?.role === 'admin';
  },
  canDelete: () => {
    // Only admin can delete content
    return get().membership?.role === 'admin';
  },

  // ─────────────────────────────
  // Supabase CRUD and tenant logic
  // ─────────────────────────────
  fetchRooms: async (userId: string) => {
    if (!userId) return;
    set({ loading: true, error: undefined });

    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*, tenant:tenants(*)')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ rooms: data || [], loading: false });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('[roomStore] ❌ Failed to fetch rooms:', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  setCurrentRoom: async (room: Room | undefined) => {
    // Enterprise standard: Clear stale data when changing rooms to ensure fresh state
    if (!room) {
      set({ 
        currentRoom: undefined,
        messages: [],      // Clear messages for new room
        alerts: [],        // Clear alerts for new room
        polls: [],         // Clear polls for new room
        tracks: [],        // Clear tracks for new room
      });
      return;
    }

    try {
      // Microsoft Pattern: Clear data but DON'T reset isRoomReady
      // TradingRoom will control isRoomReady state after data loads
      // This prevents double state changes and scroll delays
      set({ 
        messages: [],
        alerts: [],
        polls: [],         // Clear polls when changing rooms
        tracks: []
        // isRoomReady: false REMOVED - let TradingRoom control this
      });

      if (room.tenant_id) {
        const tenant = await get().loadTenantData(room.tenant_id);
        set({ currentRoom: { ...room, tenant } });
      } else {
        set({ currentRoom: room });
      }
      localStorage.setItem(LAST_ROOM_KEY, room.id);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('[roomStore] ❌ Failed to set current room:', errorMessage);
      set({ error: errorMessage });
    }
  },

  clearRoom: () => {
    set({ currentRoom: undefined });
  },

  createRoom: async (name: string, tenantId: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert([{ name, title: name, tenant_id: tenantId, created_by: userId }])
        .select()
        .single();

      if (error) throw error;

      set((state: RoomState) => ({ rooms: [data, ...state.rooms] }));
      return data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('[roomStore] ❌ Failed to create room:', errorMessage);
      set({ error: errorMessage });
      return undefined;
    }
  },

  updateRoom: async (roomId: string, data: Partial<Room>) => {
    try {
      const { error } = await supabase.from('rooms').update(data).eq('id', roomId);
      if (error) throw error;

      set((state: RoomState) => ({
        rooms: state.rooms.map((r: Room) => (r.id === roomId ? { ...r, ...data } : r)),
      }));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('[roomStore] ❌ Failed to update room:', errorMessage);
      set({ error: errorMessage });
    }
  },

  loadTenantData: async (tenantId: string) => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (error) throw error;
      return data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('[roomStore] ❌ Failed to load tenant:', errorMessage);
      return undefined;
    }
  },

  // ─────────────────────────────
  // Local state management
  // ─────────────────────────────
  setRoomReady: (ready: boolean) => set({ isRoomReady: ready }),

  getLastRoomId: () => {
    try {
      const value = localStorage.getItem(LAST_ROOM_KEY);
      return value || undefined;
    } catch (error) {
      return undefined;
    }
  },

  clearLastRoomId: () => {
    try {
      localStorage.removeItem(LAST_ROOM_KEY);
    } catch (error) {
      // Silently fail if localStorage is not available
      console.debug('[roomStore] Failed to clear last room ID:', error);
    }
  },

  // ─────────────────────────────
  // Messages / alerts / media / members
  // ─────────────────────────────
  setMessages: (messages: ChatMessage[]) => set({ messages }),
  addMessage: (message: ChatMessage) =>
    set((state: RoomState) => {
      // Enterprise standard: Prevent duplicates (optimistic updates + real-time can cause duplicates)
      const exists = state.messages.some((m: ChatMessage) => m.id === message.id);
      if (exists) return state;
      return { messages: [...state.messages, message] };
    }),
  updateMessage: (id: string, updates: Partial<ChatMessage>) =>
    set((state: RoomState) => ({
      messages: state.messages.map((msg: ChatMessage) => (msg.id === id ? { ...msg, ...updates } : msg)),
    })),
  removeMessage: (id: string) => set((state: RoomState) => ({ messages: state.messages.filter((m: ChatMessage) => m.id !== id) })),

  setAlerts: (alerts: Alert[]) => set({ alerts }),
  addAlert: (alert: Alert) =>
    set((state: RoomState) => {
      const exists = state.alerts.some((a: Alert) => a.id === alert.id);
      if (exists) return state;
      return { alerts: [...state.alerts, alert] }; // Append at end - newest at bottom
    }),
  removeAlert: (id: string) => set((state: RoomState) => ({ alerts: state.alerts.filter((a: Alert) => a.id !== id) })),

  setPolls: (polls: Poll[]) => set({ polls }),
  addPoll: (poll: Poll) =>
    set((state: RoomState) => {
      // Enterprise standard: Prevent duplicates (optimistic updates + real-time can cause duplicates)
      const exists = state.polls.some((p: Poll) => p.id === poll.id);
      if (exists) return state;
      return { polls: [...state.polls, poll] };
    }),
  removePoll: (id: string) => set((state: RoomState) => ({ polls: state.polls.filter((p: Poll) => p.id !== id) })),

  setTracks: (tracks: MediaTrack[]) => set({ tracks }),
  addTrack: (track: MediaTrack) => set((state: RoomState) => ({ tracks: [...state.tracks, track] })),
  updateTrack: (id: string, updates: Partial<MediaTrack>) =>
    set((state: RoomState) => ({
      tracks: state.tracks.map((t: MediaTrack) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  removeTrack: (id: string) => set((state: RoomState) => ({ tracks: state.tracks.filter((t: MediaTrack) => t.id !== id) })),

  setMembers: (members: RoomMember[]) => set({ members }),
  addMember: (member: RoomMember) =>
    set((state: RoomState) => {
      const exists = state.members.some((m: RoomMember) => m.id === member.id);
      if (exists) return state;
      return { members: [...state.members, member] };
    }),
  removeMember: (userId: string) =>
    set((state: RoomState) => ({ members: state.members.filter((m: RoomMember) => m.id !== userId) })),
  updateMemberLocation: (userId: string, location: { city?: string; region?: string; country?: string; country_code?: string }) =>
    set((state: RoomState) => ({
      members: state.members.map((m: RoomMember) =>
        m.id === userId ? { ...m, ...location } : m
      ),
    })),

  setMembership: (membership: RoomMembership | undefined) => {
    console.log('[RoomStore] ✅ setMembership:', membership?.role || 'none');
    set({ membership });
  },
  setViewers: (count: number) => set({ viewers: count }),
  setRecording: (isRecording: boolean, recordingId: string | undefined) => set({ isRecording, recordingId }),
  setMicEnabled: (enabled: boolean) => set({ isMicEnabled: enabled }),
  setVolume: (volume: number) => set({ volume }),
  setMuted: (muted: boolean) => set({ isMuted: muted }),
  setRefreshing: (refreshing: boolean) => set({ isRefreshing: refreshing }),
}));
