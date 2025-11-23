/**
 * ENTERPRISE GRADE: Room Membership Service
 * ============================================================================
 * Microsoft Azure AD B2C Pattern: Explicit membership management
 * No auto-creation - all memberships must be explicitly granted
 * ============================================================================
 */

import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type RoomMembership = Database['public']['Tables']['room_memberships']['Row'];
type RoomMembershipInsert = Database['public']['Tables']['room_memberships']['Insert'];

export interface MembershipValidationResult {
  isValid: boolean;
  membership?: RoomMembership;
  error?: string;
  errorCode?: 'NOT_FOUND' | 'RLS_DENIED' | 'NETWORK_ERROR' | 'INVALID_DATA';
}

/**
 * ENTERPRISE PATTERN: Validate user membership with detailed error reporting
 * Returns structured result with error codes for proper error handling
 */
export async function validateMembership(
  userId: string,
  roomId: string
): Promise<MembershipValidationResult> {
  try {
    console.log('[MembershipService] 🔐 Validating membership:', { userId, roomId });

    // Query with proper error handling
    const { data, error } = await supabase
      .from('room_memberships')
      .select('*')
      .eq('user_id', userId)
      .eq('room_id', roomId)
      .single();

    // Handle specific error cases
    if (error) {
      // PGRST116 = No rows found - user not a member
      if (error.code === 'PGRST116') {
        console.warn('[MembershipService] ⚠️ User not a member of room');
        return {
          isValid: false,
          error: 'User is not a member of this room',
          errorCode: 'NOT_FOUND'
        };
      }

      // RLS policy denied access
      if (error.message.includes('policy')) {
        console.error('[MembershipService] ❌ RLS policy denied access');
        return {
          isValid: false,
          error: 'Access denied by security policy',
          errorCode: 'RLS_DENIED'
        };
      }

      // Network or other error
      console.error('[MembershipService] ❌ Database error:', error);
      return {
        isValid: false,
        error: error.message,
        errorCode: 'NETWORK_ERROR'
      };
    }

    // No data returned
    if (!data) {
      console.warn('[MembershipService] ⚠️ No membership data returned');
      return {
        isValid: false,
        error: 'Membership not found',
        errorCode: 'NOT_FOUND'
      };
    }

    // Success
    console.log('[MembershipService] ✅ Membership validated:', data.role);
    return {
      isValid: true,
      membership: data as RoomMembership
    };

  } catch (error) {
    console.error('[MembershipService] ❌ Fatal error:', error);
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: 'NETWORK_ERROR'
    };
  }
}

/**
 * ENTERPRISE PATTERN: Create membership with proper validation
 * Only callable by room admins or system
 */
export async function createMembership(
  userId: string,
  roomId: string,
  role: 'admin' | 'moderator' | 'member' = 'member'
): Promise<MembershipValidationResult> {
  try {
    console.log('[MembershipService] 📝 Creating membership:', { userId, roomId, role });

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return {
        isValid: false,
        error: 'User not found',
        errorCode: 'INVALID_DATA'
      };
    }

    // Verify room exists
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return {
        isValid: false,
        error: 'Room not found',
        errorCode: 'INVALID_DATA'
      };
    }

    // Create membership
    const membershipData: RoomMembershipInsert = {
      user_id: userId,
      room_id: roomId,
      role,
      joined_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('room_memberships')
      .insert(membershipData)
      .select()
      .single();

    if (error) {
      // Handle duplicate key error (membership already exists)
      if (error.code === '23505') {
        console.log('[MembershipService] ℹ️ Membership already exists, fetching...');
        return validateMembership(userId, roomId);
      }

      console.error('[MembershipService] ❌ Failed to create membership:', error);
      return {
        isValid: false,
        error: error.message,
        errorCode: 'NETWORK_ERROR'
      };
    }

    if (!data) {
      return {
        isValid: false,
        error: 'Failed to create membership',
        errorCode: 'NETWORK_ERROR'
      };
    }

    console.log('[MembershipService] ✅ Membership created successfully');
    return {
      isValid: true,
      membership: data as RoomMembership
    };

  } catch (error) {
    console.error('[MembershipService] ❌ Fatal error:', error);
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: 'NETWORK_ERROR'
    };
  }
}

/**
 * ENTERPRISE PATTERN: Get all user memberships
 */
export async function getUserMemberships(userId: string): Promise<RoomMembership[]> {
  try {
    const { data, error } = await supabase
      .from('room_memberships')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('[MembershipService] ❌ Failed to fetch memberships:', error);
      return [];
    }

    return (data as RoomMembership[]) || [];
  } catch (error) {
    console.error('[MembershipService] ❌ Fatal error:', error);
    return [];
  }
}

/**
 * ENTERPRISE PATTERN: Check if user has specific role in room
 */
export async function hasRole(
  userId: string,
  roomId: string,
  requiredRole: 'admin' | 'moderator' | 'member'
): Promise<boolean> {
  const result = await validateMembership(userId, roomId);
  
  if (!result.isValid || !result.membership) {
    return false;
  }

  const roleHierarchy = { admin: 3, moderator: 2, member: 1 };
  const userRoleLevel = roleHierarchy[result.membership.role as keyof typeof roleHierarchy] || 0;
  const requiredRoleLevel = roleHierarchy[requiredRole];

  return userRoleLevel >= requiredRoleLevel;
}
