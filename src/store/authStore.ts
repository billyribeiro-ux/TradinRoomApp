import type { User, Session, RealtimeChannel } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '../lib/supabase';

import { useRoomStore } from './roomStore';

/**
 * Microsoft Enterprise Pattern: Authentication State Store
 * 
 * Following Azure AD B2C patterns and TypeScript strict mode standards
 */

interface AuthState {
  user: User | undefined;
  session: Session | undefined;
  isAuthenticated: boolean;
  initialized: boolean;
  sessionToken: string | undefined;
  
  // Microsoft pattern: Command-based actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | undefined }>;
  login: (email: string, password: string) => Promise<{ error: Error | undefined }>; // Alias for compatibility
  signOut: () => Promise<void>;
  setSession: (session: Session | undefined) => void;
  refreshSession: () => Promise<void>;
  
  // Microsoft Azure AD pattern: Single session enforcement
  enforceSession: (userId: string) => Promise<void>;
  monitorSession: () => void;
  cleanupSession: () => Promise<void>;
}

// Microsoft Azure AD pattern: Session monitoring state
let sessionMonitorInterval: NodeJS.Timeout | undefined = undefined;
let sessionChannel: RealtimeChannel | undefined = undefined;

// Secure session storage using in-memory storage instead of localStorage to prevent XSS
// @ts-ignore - Reserved for future session security implementation
let secureSessionData: { currentSession: Session, expiresAt: number } | undefined = undefined;

export const useAuthStore = create<AuthState>((set: (state: Partial<AuthState> | ((state: AuthState) => Partial<AuthState>)) => void, get: () => AuthState) => ({
  user: undefined,
  session: undefined,
  isAuthenticated: false,
  initialized: false,
  sessionToken: undefined,

  initialize: async () => {
    try {
      // Microsoft Azure AD pattern: Initialize session monitoring
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[AuthStore] Failed to get session:', error);
        set({ initialized: true });
        return;
      }

      if (session) {
        set({
          user: session.user,
          session,
          isAuthenticated: true,
          sessionToken: session.access_token,
        });

        // Store session securely in memory
        secureSessionData = {
          currentSession: session,
          expiresAt: Math.floor(Date.now() / 1000) + session.expires_in
        };

        // Session enforcement enabled for security
        await get().enforceSession(session.user.id);
      }

      // Microsoft Azure AD pattern: Monitor session changes
      get().monitorSession();
      
      set({ initialized: true });
      
    } catch (error) {
      console.error('[AuthStore] Fatal initialization error:', error);
      set({ initialized: true });
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      // ENTERPRISE PATTERN: Enforce email verification (Microsoft/Google standard)
      if (data.user && !data.user.email_confirmed_at) {
        console.error('[AuthStore] ❌ Email not verified');
        await supabase.auth.signOut();
        return { 
          error: new Error('Please verify your email before logging in. Check your inbox and spam folder.') 
        };
      }

      // ENTERPRISE PATTERN: Validate user record exists in database
      if (data.user) {
        const { data: userRecord, error: userError } = await supabase
          .from('users')
          .select('id, email, role')
          .eq('id', data.user.id)
          .single();

        if (userError || !userRecord) {
          console.error('[AuthStore] ❌ User record not found in database');
          console.error('[AuthStore] 🚨 User exists in auth but not in public.users table');
          await supabase.auth.signOut();
          return { 
            error: new Error('Account not found. Please complete registration or contact support.') 
          };
        }

        console.log('[AuthStore] ✅ User validated:', userRecord.email, '- Role:', userRecord.role);
      }

      if (data.session) {
        set({
          user: data.user,
          session: data.session,
          isAuthenticated: true,
        });

        // Store session securely in memory
        secureSessionData = {
          currentSession: data.session,
          expiresAt: Math.floor(Date.now() / 1000) + data.session.expires_in
        };

        // Microsoft Azure AD pattern: Enforce single session
        await get().enforceSession(data.user.id);
      }

      return { error: undefined };
    } catch (error) {
      console.error('[AuthStore] Sign in error:', error);
      return { error: error as Error };
    }
  },

  // Alias for backwards compatibility
  login: async (email: string, password: string) => {
    return get().signIn(email, password);
  },

  signOut: async () => {
    try {
      // Microsoft Azure AD pattern: Clean up session first
      await get().cleanupSession();
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[AuthStore] Sign out error:', error);
      }

      set({
        user: undefined,
        session: undefined,
        isAuthenticated: false,
      });

      // Clear secure session data
      secureSessionData = undefined;
      
    } catch (error) {
      console.error('[AuthStore] Fatal sign out error:', error);
      set({
        user: undefined,
        session: undefined,
        isAuthenticated: false,
      });
    }
  },

  setSession: (session: Session | undefined) => {
    if (session) {
      set({
        user: session.user,
        session,
        isAuthenticated: true,
      });
      
      // Store session securely in memory
      secureSessionData = {
        currentSession: session,
        expiresAt: Math.floor(Date.now() / 1000) + session.expires_in
      };
    } else {
      set({
        user: undefined,
        session: undefined,
        isAuthenticated: false,
      });
      // Clear secure session data
      secureSessionData = undefined;
    }
  },

  refreshSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('[AuthStore] Refresh error:', error);
        return;
      }

      if (session) {
        set({
          user: session.user,
          session,
          isAuthenticated: true,
        });
        
        // Store session securely in memory
        secureSessionData = {
          currentSession: session,
          expiresAt: Math.floor(Date.now() / 1000) + session.expires_in
        };
      }
    } catch (error) {
      console.error('[AuthStore] Fatal refresh error:', error);
    }
  },

  // ============================================================================
  // MICROSOFT AZURE AD PATTERN: SINGLE SESSION ENFORCEMENT
  // ============================================================================
  
  enforceSession: async (userId: string) => {
    try {
      // Generate unique session token
      const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      // Enforcing single session for user
      
      // Delete ALL existing sessions for this user
      await supabase
        .from('sessions')
        .delete()
        .eq('user_id', userId);
      
      // Get current room ID if user is in a room
      const { currentRoom } = useRoomStore.getState();
      
      // Create new session record - only if user is in a room
      if (!currentRoom?.id) {
        console.warn('[AuthStore] No room - skipping session creation');
        set({ sessionToken });
        return;
      }
      
      const { error } = await supabase
        .from('sessions')
        .insert({
          user_id: userId,
          room_id: currentRoom.id, // Microsoft pattern: No null values
          session_token: sessionToken,
          user_agent: navigator.userAgent,
          last_activity: new Date().toISOString(),
        });
      
      if (error) {
        console.error('[AuthStore] Failed to create session:', error);
        return;
      }
      
      set({ sessionToken });
      // Session enforced
      
      // Start monitoring for duplicate logins
      get().monitorSession();
      
    } catch (error) {
      console.error('[AuthStore] Error enforcing session:', error);
    }
  },

  monitorSession: () => {
    const { user, sessionToken } = get();
    if (!user || !sessionToken) return;
    
    // Starting session monitoring
    
    // Clear any existing monitoring
    if (sessionMonitorInterval) {
      clearInterval(sessionMonitorInterval);
    }
    if (sessionChannel) {
      supabase.removeChannel(sessionChannel);
    }
    
    // Microsoft Pattern: Passive session monitoring - no automatic logouts
    // Session monitoring initialized (passive mode)
    
    // Only update last activity periodically, don't force logout
    sessionMonitorInterval = setInterval(async () => {
      try {
        if (sessionToken) {
          await supabase
            .from('sessions')
            .update({ last_activity: new Date().toISOString() })
            .eq('session_token', sessionToken);
        }
      } catch (error) {
        console.debug('[AuthStore] Session update error:', error);
      }
    }, 60000); // Update every 60 seconds
  },

  cleanupSession: async () => {
    const { sessionToken } = get();
    
    // Cleaning up session
    
    // Stop monitoring
    if (sessionMonitorInterval) {
      clearInterval(sessionMonitorInterval);
      sessionMonitorInterval = undefined;
    }
    if (sessionChannel) {
      supabase.removeChannel(sessionChannel);
      sessionChannel = undefined;
    }
    
    // Delete session from database
    if (sessionToken) {
      await supabase
        .from('sessions')
        .delete()
        .eq('session_token', sessionToken);
    }
    
    set({ sessionToken: undefined });
  },
}));

export const initializeAuth = () => {
  return useAuthStore.getState().initialize();
};