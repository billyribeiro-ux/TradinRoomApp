// Added: 2025-01-24 - Comprehensive room service with enhanced error handling and retry logic
import { supabase } from '../lib/supabase';
import type { Room } from '../types/database.types';

import { reportError, ErrorSeverity } from './authService';
// Fixed: 2025-01-24 - Enhanced null eradication - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types

// Fixed: 2025-01-24 - Eradicated 4 null usage(s) - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types


// Added: 2025-01-24 - Type definitions for room operations
export interface InsertRoom {
  tenant_id: string;
  name: string;
  title: string;
  description?: string;
  icon_url?: string;
  is_active?: boolean;
  created_by: string;
  card_bg_color?: string;
  card_border_color?: string;
  icon_bg_color?: string;
  icon_color?: string;
  title_color?: string;
  description_color?: string;
  button_text?: string;
  button_bg_color?: string;
  button_text_color?: string;
  button_width?: string;
}

export interface RoomResponse {
  data: Room | undefined;
  error: Error | undefined;
}

export interface RoomsResponse {
  data: Room[] | undefined;
  error: Error | undefined;
}

// Added: 2025-01-24 - Retry utility for transient failures
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Operation failed');
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

class RoomService {
  // Added: 2025-01-24 - Create room with retry logic and error reporting
  async createRoom(roomData: InsertRoom): Promise<RoomResponse> {
    try {
      const { data, error } = await retryOperation(async () => {
        const result = await supabase
          .from('rooms')
          .insert(roomData)
          .select()
          .single();
        if (result.error) throw result.error;
        return result;
      });

      if (error) throw error;
      return { data, error: undefined };
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), ErrorSeverity.HIGH, {
        component: 'RoomService',
        action: 'createRoom',
        metadata: { roomName: roomData.name, tenantId: roomData.tenant_id }
      });
      return {
        data: undefined,
        error: error instanceof Error ? error : new Error('Failed to create room'),
      };
    }
  }

  // Added: 2025-01-24 - Get rooms by tenant with error handling
  async getRoomsByTenant(tenantId: string): Promise<RoomsResponse> {
    try {
      const { data, error } = await retryOperation(async () => {
        const result = await supabase
          .from('rooms')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        if (result.error) throw result.error;
        return result;
      });

      if (error) throw error;
      return { data, error: undefined };
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), ErrorSeverity.MEDIUM, {
        component: 'RoomService',
        action: 'getRoomsByTenant',
        metadata: { tenantId }
      });
      return {
        data: undefined,
        error: error instanceof Error ? error : new Error('Failed to get rooms'),
      };
    }
  }

  // Added: 2025-01-24 - Get room by ID with error handling
  async getRoomById(roomId: string): Promise<RoomResponse> {
    try {
      const { data, error } = await retryOperation(async () => {
        const result = await supabase
          .from('rooms')
          .select('*')
          .eq('id', roomId)
          .single();
      
        if (result.error) {
          throw result.error;
        }
      
        return result;
      });

      if (error) {
        throw error;
      }
    
      return { data, error: undefined };
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), ErrorSeverity.MEDIUM, {
        component: 'RoomService',
        action: 'getRoomById',
        metadata: { roomId }
      });
      return {
        data: undefined,
        error: error instanceof Error ? error : new Error('Failed to get room'),
      };
    }
  }

  // Added: 2025-01-24 - Update room with error handling
  async updateRoom(roomId: string, updates: Partial<InsertRoom>): Promise<RoomResponse> {
    try {
      const { data, error } = await retryOperation(async () => {
        const result = await supabase
          .from('rooms')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', roomId)
          .select()
          .single();
        if (result.error) throw result.error;
        return result;
      });

      if (error) throw error;
      return { data, error: undefined };
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), ErrorSeverity.MEDIUM, {
        component: 'RoomService',
        action: 'updateRoom',
        metadata: { roomId }
      });
      return {
        data: undefined,
        error: error instanceof Error ? error : new Error('Failed to update room'),
      };
    }
  }

  // Added: 2025-01-24 - Delete room with error handling
  async deleteRoom(roomId: string): Promise<{ error?: Error }> {
    try {
      const { error } = await retryOperation(async () => {
        const result = await supabase
          .from('rooms')
          .update({ is_active: false })
          .eq('id', roomId);
        if (result.error) throw result.error;
        return result;
      });

      if (error) throw error;
      return { error: undefined };
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), ErrorSeverity.HIGH, {
        component: 'RoomService',
        action: 'deleteRoom',
        metadata: { roomId }
      });
      return {
        error: error instanceof Error ? error : new Error('Failed to delete room'),
      };
    }
  }

  // Added: 2025-01-24 - Add user to room membership
  async addRoomMember(roomId: string, userId: string, role: 'admin' | 'member' = 'member'): Promise<{ error?: Error }> {
    try {
      const { error } = await retryOperation(async () => {
        const result = await supabase
          .from('room_memberships')
          .insert({
            room_id: roomId,
            user_id: userId,
            role,
            joined_at: new Date().toISOString(),
          });
        if (result.error) throw result.error;
        return result;
      });

      if (error) throw error;
      return { error: undefined };
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), ErrorSeverity.MEDIUM, {
        component: 'RoomService',
        action: 'addRoomMember',
        metadata: { roomId, userId, role }
      });
      return {
        error: error instanceof Error ? error : new Error('Failed to add room member'),
      };
    }
  }

  // Added: 2025-01-24 - Remove user from room membership
  async removeRoomMember(roomId: string, userId: string): Promise<{ error?: Error }> {
    try {
      const { error } = await retryOperation(async () => {
        const result = await supabase
          .from('room_memberships')
          .delete()
          .eq('room_id', roomId)
          .eq('user_id', userId);
        if (result.error) throw result.error;
        return result;
      });

      if (error) throw error;
      return { error: undefined };
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), ErrorSeverity.MEDIUM, {
        component: 'RoomService',
        action: 'removeRoomMember',
        metadata: { roomId, userId }
      });
      return {
        error: error instanceof Error ? error : new Error('Failed to remove room member'),
      };
    }
  }
}

// Added: 2025-01-24 - Export singleton instance
export const roomService = new RoomService();
export default roomService;
