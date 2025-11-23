/**
 * API Service - Centralized API calls for Revolution Trading Room
 * Handles all external API communications and data fetching
 * 
 * UPDATED: 2025-01-27 - Fixed to match new clean database schema
 */

import { supabase, withAuth } from '../lib/supabase';
import type { Database, Room, ChatMessage, Alert, RoomMembership, Poll } from '../types/database.types';

type TableName = keyof Database['public']['Tables'];
import { DatabaseError } from '../lib/errors';
import { queryCache, CacheKeys, invalidateRoomCache } from '../utils/queryCache';

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  success: boolean;
}

export class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  }

  /**
   * Generic GET request
   */
  public async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data, success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error', success: false };
    }
  }

  /**
   * Generic POST request
   * Enterprise standard: Type-safe request body
   */
  public async post<T>(endpoint: string, body: Record<string, unknown>): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data, success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error', success: false };
    }
  }

  /**
   * Generic PUT request
   * Enterprise standard: Type-safe request body
   */
  public async put<T>(endpoint: string, body: Record<string, unknown>): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data, success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error', success: false };
    }
  }

  /**
   * Generic DELETE request
   */
  public async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data, success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error', success: false };
    }
  }

  /**
   * Supabase-specific methods
   */
  // FIXED: Updated valid table list to match new schema
  private readonly VALID_TABLES = [
    'users', 'tenants', 'rooms', 'room_memberships',
    'chatmessages', 'alerts', 'notes', 'sessions', 'user_themes',
    'user_integrations', 'system_configuration', 'tenant_configuration',
    'mediatrack', 'room_files', 'polls', 'poll_votes'
  ];

  public async getSupabaseData<T>(table: string, select = '*'): Promise<ApiResponse<T[]>> {
    try {
      // Table name validation for runtime safety
      if (!this.VALID_TABLES.includes(table)) {
        return { error: `Invalid table name: ${table}`, success: false };
      }
      
      const { data, error } = await supabase.from(table as TableName).select(select);
      
      if (error) {
        throw error;
      }

      return { data: (data as T[]) || [], success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error', success: false };
    }
  }

  public async insertSupabaseData<T>(table: string, data: Record<string, unknown>): Promise<ApiResponse<T>> {
    try {
      // Table name validation for runtime safety
      if (!this.VALID_TABLES.includes(table)) {
        return { error: `Invalid table name: ${table}`, success: false };
      }
      
      const { data: result, error } = await supabase.from(table as TableName).insert(data as never).select().single();
      
      if (error) {
        throw error;
      }

      return { data: result as T, success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error', success: false };
    }
  }

  public async updateSupabaseData<T>(table: string, id: string, data: Partial<Record<string, unknown>>): Promise<ApiResponse<T>> {
    try {
      const { data: result, error } = await supabase.from(table as TableName).update(data).eq('id', id).select().single();
      
      if (error) {
        throw error;
      }

      return { data: result as T, success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error', success: false };
    }
  }

  public async deleteSupabaseData(table: string, id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.from(table as TableName).delete().eq('id', id);
      
      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error', success: false };
    }
  }
}

// Singleton instance
export const apiService = new ApiService();

// ======================================================
// 🏠 Room-specific functions
// ======================================================

/**
 * Get all rooms for a specific user
 */
/**
 * Get all rooms for a specific user
 * Enterprise standard: Type-safe room fetching with caching
 */
export const getUserRooms = async (userId: string, useCache = true): Promise<Room[]> => {
  try {
    const cacheKey = CacheKeys.userRooms(userId);
    
    // Check cache first
    if (useCache) {
      const cached = queryCache.get<Room[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: false});
    
    if (error) {
      console.error('[API] Error fetching user rooms:', error);
      throw error;
    }
    
    // Cache the result
    if (useCache && data) {
      queryCache.set(cacheKey, data as Room[], 5 * 60 * 1000); // 5 minute cache
    }
    
    return (data as Room[]) || [];
  } catch (error) {
    console.error('[API] Error fetching user rooms:', error);
    throw error;
  }
};

/**
 * Delete a room
 */
export const deleteRoom = async (roomId: string, userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', roomId);
    
    if (error) {
      throw error;
    }
    
    // Invalidate room caches
    invalidateRoomCache(roomId);
    queryCache.invalidate(CacheKeys.userRooms(userId));
  } catch (error) {
    console.error('Error deleting room:', error);
    throw error;
  }
};

export default apiService;

// ======================================================
// 🔧 FIXED: Changed console.warn → console.debug
// These logs only show when "Verbose" is enabled in DevTools
// ======================================================

// Missing exports for TradingRoom compatibility
/**
 * Get messages for a specific room by room_id
 * Enterprise standard: Supports pagination with caching
 * Chat convention: Ordered ASC (oldest → newest) for natural chat flow
 * Note: Alerts use DESC order (newest first) - different pattern for different use case
 * 
 * @param roomId - Room ID to fetch messages for
 * @param limit - Maximum number of messages to fetch (default: 100)
 * @param offset - Number of messages to skip for pagination (default: 0)
 * @param useCache - Whether to use query cache (default: true)
 */
export const getRoomMessages = async (
  roomId: string,
  limit = 100,
  offset = 0,
  useCache = true
) => {
  try {
    const cacheKey = `${CacheKeys.roomMessages(roomId)}:${limit}:${offset}`;
    
    // Use cache if enabled and offset is 0 (first page only)
    if (useCache && offset === 0) {
      const cached = queryCache.get<ChatMessage[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    // Enterprise standard: Join users table to fetch display_name and email
    const { data, error } = await supabase
      .from('chatmessages')
      .select('*, user:users!chatmessages_user_id_fkey(id, display_name, email)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)
    
    if (error) {
      // Enterprise standard: Always log errors
      console.error('[API] Error fetching room messages:', error);
      throw error;
    }
    
    // Cache the result (first page only)
    if (useCache && offset === 0 && data) {
      queryCache.set(cacheKey, data, 2 * 60 * 1000); // 2 minute cache
    }
    
    return (data as ChatMessage[]) || [];
  } catch (error) {
    // Enterprise standard: Always log errors
    console.error('[API] Error fetching room messages:', error);
    return []; // Return empty array on error to prevent crashes
  }
};

/**
 * Get alerts for a specific room by room_id
 * Enterprise standard: Supports pagination with caching
 * Alert convention: Ordered DESC (newest → oldest) - newest alerts first
 * FIXED: Changed from getTenantAlerts() which used non-existent tenant_id field
 * Database schema confirms alerts table has room_id foreign key, not tenant_id
 * 
 * @param roomId - Room ID to fetch alerts for
 * @param limit - Maximum number of alerts to fetch (default: 50)
 * @param offset - Number of alerts to skip for pagination (default: 0)
 * @param useCache - Whether to use query cache (default: true)
 */
export const getRoomAlerts = async (
  roomId: string,
  limit = 50,
  offset = 0,
  useCache = true
) => {
  try {
    const cacheKey = `${CacheKeys.roomAlerts(roomId)}:${limit}:${offset}`;
    
    // Use cache if enabled and offset is 0 (first page only)
    if (useCache && offset === 0) {
      const cached = queryCache.get<Alert[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    // Enterprise standard: Join users table to fetch author display_name and email
    const { data, error } = await supabase
      .from('alerts')
      .select(`
        *,
        author:users!author_id(id, display_name, email)
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) {
      // Enterprise standard: Always log errors
      console.error('[API] getRoomAlerts: Database error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        roomId
      });
      throw error;
    }
    
    // Cache the result (first page only)
    if (useCache && offset === 0 && data) {
      queryCache.set(cacheKey, data, 1 * 60 * 1000); // 1 minute cache for alerts
    }
    
    return (data as Alert[]) || [];
  } catch (error) {
    // Enterprise standard: Always log errors
    console.error('[API] getRoomAlerts: Fatal error:', error);
    // Return empty array on error to prevent crashes (matches getRoomMessages pattern)
    return [];
  }
};

/**
 * @deprecated Use getRoomAlerts(roomId) instead. Alerts table uses room_id, not tenant_id.
 * Kept for backward compatibility during migration.
 */
export const getTenantAlerts = async (_tenantId: string) => {
  // Enterprise standard: Only warn in development
  if (import.meta.env.MODE === 'development') {
    console.warn('[API] getTenantAlerts: DEPRECATED - Use getRoomAlerts(roomId) instead. Alerts table has room_id, not tenant_id.');
  }
  return [];
};

/**
 * Get user's role in a specific room
 * Queries room_memberships table to return full membership record
 * Returns RoomMembership type which includes id, room_id, user_id, role, joined_at
 */
export const getUserRoomRole = async (userId: string, roomId: string): Promise<RoomMembership | undefined> => {
  try {
    if (import.meta.env.MODE === 'development') {
      console.debug('[API] getUserRoomRole: Fetching membership for user', userId, 'in room', roomId);
    }

    const { data, error } = await supabase
      .from('room_memberships' as const)
      .select('*')
      .eq('user_id', userId)
      .eq('room_id', roomId)
      .single();

    if (error) {
      // PGRST116 = "No rows returned" - user is not a member of the room
      if (error.code === 'PGRST116') {
        if (import.meta.env.MODE === 'development') {
          console.debug('[API] getUserRoomRole: User not found in room_memberships - user may not be registered in this room');
        }
        return undefined;
      }
      
      console.error('[API] getUserRoomRole: Database error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return undefined;
    }

    if (!data) {
      if (import.meta.env.MODE === 'development') {
        console.debug('[API] getUserRoomRole: No membership data found');
      }
      return undefined;
    }

  const membership = data as RoomMembership;
    
    if (import.meta.env.MODE === 'development') {
      console.debug('[API] getUserRoomRole: User role is', membership.role);
    }

  return membership;
  } catch (error) {
    console.error('[API] getUserRoomRole: Fatal error:', error);
    return undefined;
  }
};

/**
 * ENTERPRISE PATTERN: Validate user room membership (Microsoft/Google standard)
 * NEVER auto-creates - membership must be granted explicitly via invitation
 * Returns existing membership or undefined if user not authorized
 * 
 * @deprecated Use validateUserRoomMembership for strict validation
 */
export const ensureUserRoomMembership = async (userId: string, roomId: string): Promise<RoomMembership | undefined> => {
  console.warn('[API] ⚠️ ensureUserRoomMembership is deprecated - use validateUserRoomMembership');
  return validateUserRoomMembership(userId, roomId);
};

/**
 * ENTERPRISE PATTERN: Validate user has room membership (strict validation)
 * NEVER auto-creates memberships - user must be explicitly invited
 * Throws error if membership not found (access denied)
 */
export const validateUserRoomMembership = async (userId: string, roomId: string): Promise<RoomMembership | undefined> => {
  try {
    console.log('[API] 🔐 validateUserRoomMembership: Checking access for user', userId, 'in room', roomId);

    // Check if membership exists
    const existing = await getUserRoomRole(userId, roomId);
    
    if (!existing) {
      console.error('[API] ❌ validateUserRoomMembership: User not a member of this room');
      console.error('[API] 🚨 Access denied - user must be invited by room admin');
      console.error('[API] 🚨 User ID:', userId);
      console.error('[API] 🚨 Room ID:', roomId);
      return undefined;
    }

    console.log('[API] ✅ validateUserRoomMembership: Access granted - Role:', existing.role);
    return existing;
    
  } catch (error) {
    console.error('[API] ❌ validateUserRoomMembership: FATAL ERROR:', error);
    console.error('[API] 🚨 User will NOT have room permissions');
    return undefined;
  }
};

/**
 * ENTERPRISE PATTERN: Create room membership via explicit invitation
 * Only admins can invite users to rooms
 */
export const createRoomMembership = async (
  roomId: string, 
  userId: string, 
  role: 'admin' | 'member' = 'member',
  invitedBy: string
): Promise<RoomMembership | undefined> => {
  try {
    console.log('[API] 🔐 createRoomMembership: Admin', invitedBy, 'inviting user', userId, 'to room', roomId);

    // Validate inviter is admin
    const inviterMembership = await getUserRoomRole(invitedBy, roomId);
    if (!inviterMembership || inviterMembership.role !== 'admin') {
      console.error('[API] ❌ createRoomMembership: Inviter is not admin');
      throw new Error('Only room admins can invite users');
    }

    // Check if user already has membership
    const existing = await getUserRoomRole(userId, roomId);
    if (existing) {
      console.log('[API] ⚠️ createRoomMembership: User already a member');
      return existing;
    }

    // Create membership
    const { data, error } = await supabase
      .from('room_memberships' as const)
      .insert({
        user_id: userId,
        room_id: roomId,
        role
      })
      .select()
      .single();

    if (error) {
      console.error('[API] ❌ createRoomMembership: Failed to create membership:', error);
      throw error;
    }

    console.log('[API] ✅ createRoomMembership: User invited successfully');
    return data as RoomMembership;
    
  } catch (error) {
    console.error('[API] ❌ createRoomMembership: FATAL ERROR:', error);
    return undefined;
  }
};

export const getActiveMediaTracks = async (_roomId: string) => {
  if (import.meta.env.MODE === 'development') {
    console.debug('getActiveMediaTracks: Not implemented yet');
  }
  return [];
};

export const uploadAlertMedia = async (
  file: File,
  tenantId: string,
  roomId: string,
  _userId: string
): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${tenantId}/${roomId}/${fileName}`;

    const { data: _data, error } = await supabase.storage
      .from('alert-media')
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('alert-media')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    // Enterprise standard: Always log errors
    console.error('[API] Error uploading alert media:', error);
    throw error;
  }
};

/**
 * Create a new alert
 * @param data - Alert data matching alerts table Insert type
 * @returns Created alert object
 * @throws DatabaseError if creation fails
 */
export const createAlert = async (data: Database['public']['Tables']['alerts']['Insert']) => {
  try {
    const { data: alertData, error } = await supabase
      .from('alerts' as const)
      .insert(data)
      .select()
      .single();
    
    if (error) {
      // Enterprise standard: Always log errors, but use console.error
      console.error('[API] Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
    
    // Invalidate alerts cache for this room
    if (alertData?.room_id) {
      invalidateRoomCache(alertData.room_id);
    }
    
    return alertData;
  } catch (error) {
    console.error('[API] Error creating alert:', error);
    throw error;
  }
};

export const getRoomPolls = async (roomId: string, useCache = true): Promise<Poll[]> => {
  return withAuth(async (client) => {
    const cacheKey = CacheKeys.roomPolls(roomId);
    
    // Check cache first
    if (useCache) {
      const cached = queryCache.get<Poll[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const { data, error } = await client
      .from('polls')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new DatabaseError('Failed to fetch polls', error, { roomId });
    }
    
    // Cache the result
    if (useCache && data) {
      queryCache.set(cacheKey, data, 3 * 60 * 1000); // 3 minute cache
    }
    
    return data || [];
  });
};

export const getPollVotes = async (pollId: string, useCache = true) => {
  try {
    const cacheKey = CacheKeys.pollVotes(pollId);
    
    // Check cache first
    if (useCache) {
      type PollVote = Database['public']['Tables']['poll_votes']['Row'];
      const cached = queryCache.get<PollVote[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const { data, error} = await supabase
      .from('poll_votes' as const)
      .select('*')
      .eq('poll_id', pollId);
    
    if (error) {
      console.error('[API] getPollVotes: Database error:', error);
      throw error;
    }
    
    // Cache the result
    if (useCache && data) {
      queryCache.set(cacheKey, data, 2 * 60 * 1000); // 2 minute cache
    }
    
    return (data as Database['public']['Tables']['poll_votes']['Row'][] | null) || [];
  } catch (error) {
    console.error('[API] Error fetching poll votes:', error);
    throw error;
  }
};

// FIXED: Changed option_id (string) to option_index (number) to match schema
export const votePoll = async (pollId: string, optionIndex: number, userId: string) => {
  try {
    const insertData = { 
      poll_id: pollId, 
      user_id: userId,
      option_index: optionIndex  // ✅ FIXED: Now uses option_index (number)
    };
    
    const { error } = await supabase
      .from('poll_votes')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('[API] votePoll: Database error:', error);
      throw error;
    }
    
    // Invalidate poll votes cache
    queryCache.invalidate(CacheKeys.pollVotes(pollId));
    
    return true;
  } catch (error) {
    console.error('[API] Error voting on poll:', error);
    throw error;
  }
};

export const createPoll = async (pollData: {
  room_id: string;
  title: string;
  description?: string;
  options: string[];
  created_by: string;
  expires_at?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('polls')
      .insert(pollData)
      .select()
      .single();
    
    if (error) throw error;
    
    // Invalidate polls cache for this room
    if (data?.room_id) {
      queryCache.invalidate(CacheKeys.roomPolls(data.room_id));
    }
    
    return data;
  } catch (error) {
    console.error('[API] Error creating poll:', error);
    throw error;
  }
};

export const deleteAlert = async (alertId: string, roomId?: string) => {
  try {
    const { error } = await supabase
      .from('alerts' as const)
      .delete()
      .eq('id', alertId);
    
    if (error) throw error;
    
    // Invalidate alerts cache for this room if roomId provided
    if (roomId) {
      invalidateRoomCache(roomId);
    }
    
    return true;
  } catch (error) {
    // Enterprise standard: Always log errors
    console.error('[API] Error deleting alert:', error);
    throw error;
  }
};

export const cleanupStaleMediaTracksHeartbeat = async (_roomId?: string, _hours?: number): Promise<number> => {
  console.debug('cleanupStaleMediaTracksHeartbeat: Not implemented yet');
  return 0;
};