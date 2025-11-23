/**
 * Admin utility functions for user management
 * Microsoft TypeScript standards - no null usage
 */

import { supabase } from '../lib/supabase';

export interface UserCount {
  total: number;
  admins: number;
  hosts: number;
  moderators: number;
  members: number;
}

/**
 * Get count of users by role
 */
export async function getUserCount(): Promise<UserCount> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role');
    
    if (error) {
      console.error('Error fetching user count:', error);
      return {
        total: 0,
        admins: 0,
        hosts: 0,
        moderators: 0,
        members: 0
      };
    }
    
    const counts = data.reduce((acc: any, user: any) => {
      acc.total++;
      acc[user.role as keyof Omit<UserCount, 'total'>]++;
      return acc;
    }, {
      total: 0,
      admins: 0,
      hosts: 0,
      moderators: 0,
      members: 0
    });
    
    return counts;
  } catch (error) {
    console.error('Error in getUserCount:', error);
    return {
      total: 0,
      admins: 0,
      hosts: 0,
      moderators: 0,
      members: 0
    };
  }
}

/**
 * Delete all users (admin only function)
 * WARNING: This is a destructive operation
 */
export async function deleteAllUsers(): Promise<{ success: boolean; error?: string }> {
  try {
    // First, get all user IDs
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id');
    
    if (fetchError) {
      return { success: false, error: fetchError.message };
    }
    
    if (!users || users.length === 0) {
      return { success: true };
    }
    
    // Delete all users
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except placeholder
    
    if (deleteError) {
      return { success: false, error: deleteError.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in deleteAllUsers:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
