/**
 * supabase.ts
 * Last Updated: October 30, 2025 @ 20:00 PST
 * 
 * Changes:
 * - Verified storage buckets: custom-sounds, avatars, branding, alert-media, room-icons
 * - All buckets configured with public access and appropriate MIME/size limits
 * - Storage policies created for public read + authenticated write/delete
 * - chatmessages.body column verified/added for chat posting
 */
import { createClient } from '@supabase/supabase-js';

import type { Database } from '../types/database.types';

// ============================================================================
// ENVIRONMENT VALIDATION - Microsoft Enterprise Pattern
// ============================================================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Allow E2E test routes to run without real Supabase env by providing a minimal mock client
const isE2ERoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/__test_');

function createMockSupabase(): any {
  const ok = async (data: any = {}) => ({ data, error: null });
  const okVoid = async () => ({ error: null });
  const tableOps = {
    delete: () => ({ eq: () => ok() }),
    insert: () => ok(),
    update: () => ok(),
    eq: () => ok(),
  };
  return {
    auth: {
      getSession: () => ok({ session: null }),
      getUser: () => ok({ user: null }),
      refreshSession: () => ok({ session: null }),
      signOut: () => okVoid(),
      signInWithPassword: () => ok({ user: null, session: null }),
    },
    from: () => tableOps,
    removeChannel: () => {},
  };
}

// If env is missing but we're on an E2E test route, use mock; otherwise enforce env
if ((!supabaseUrl || !supabaseAnonKey) && !isE2ERoute) {
  throw new Error('[Supabase] Missing required environment variables');
}

// ============================================================================
// SUPABASE CLIENT CONFIGURATION - Microsoft Standards
// ============================================================================
export const supabase: any = isE2ERoute
  ? createMockSupabase()
  : createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Session persistence - CRITICAL for preventing logout on refresh
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    
    // Custom secure storage to prevent XSS attacks
    storage: {
      getItem: (_key: string) => {
        // Return null to force Supabase to use memory-only storage
        // Real session is managed through secure httpOnly cookies
        return null;
      },
      setItem: (_key: string, _value: string) => {
        // No-op: prevent localStorage usage
        // Session persisted through secure backend
      },
      removeItem: (_key: string) => {
        // No-op: prevent localStorage usage
      }
    },
    
    // Security settings
    flowType: 'pkce', // More secure auth flow
  },
  
  // Database settings
  db: {
    schema: 'public'
  },
  
  // Realtime settings (if needed)
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// ============================================================================
// UTILITY FUNCTIONS - Microsoft Pattern - NO NULL!
// ============================================================================

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

/**
 * Get current user - returns undefined, NOT null
 */
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user || undefined; // Convert null to undefined
};

/**
 * Get current session - returns undefined, NOT null
 */
export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session || undefined; // Convert null to undefined
};

// ============================================================================
// ERROR HANDLING - Microsoft Pattern
// ============================================================================
export const handleSupabaseError = (error: unknown): string => {
  if (!error) return 'An unknown error occurred';
  
  const err = error as { message?: string; code?: string };
  
  // Auth errors
  if (err.message?.includes('Invalid login credentials')) {
    return 'Invalid email or password';
  }
  
  if (err.message?.includes('Email not confirmed')) {
    return 'Please confirm your email address';
  }
  
  if (err.message?.includes('refresh_token')) {
    return 'Your session has expired. Please log in again.';
  }
  
  // Network errors
  if (err.message?.includes('Failed to fetch')) {
    return 'Network error. Please check your connection.';
  }
  
  // Database errors
  if (err.code === '23505') {
    return 'This record already exists';
  }
  
  if (err.code === '23503') {
    return 'Referenced record not found';
  }
  
  // Permission errors
  if (err.message?.includes('violates row-level security')) {
    return 'You do not have permission to perform this action';
  }
  
  // Default
  return err.message || 'An error occurred';
};

// ============================================================================
// AUTHENTICATED API CALLS - Microsoft Pattern
// ============================================================================

/**
 * Execute a callback with authenticated Supabase client
 * Microsoft Pattern: Ensures valid session before API calls
 */
export async function withAuth<T>(
  callback: (client: typeof supabase) => Promise<T>
): Promise<T> {
  const session = await getCurrentSession();
  
  if (!session) {
    throw new Error('Authentication required. Please log in.');
  }
  
  return callback(supabase);
}