/**
 * AuthContext.tsx
 * ------------------------------------------------------------
 * Authentication context provider
 * Provides auth state to entire application with session management
 * Microsoft-standard: Centralized auth state management
 */

import type { User as SupabaseUser, Session, AuthChangeEvent } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

import { AuthError } from '../lib/errors';
import { supabase } from '../lib/supabase';

/**
 * Authenticated user interface
 */
export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

/**
 * Auth context type
 */
export interface AuthContextType {
  user: AuthUser | undefined;
  session: Session | undefined;
  loading: boolean;
  error: Error | undefined;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

/**
 * Create auth context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth provider component
 * Wraps the application and provides auth state
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | undefined>(undefined);
  const [session, setSession] = useState<Session | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);

  /**
   * Convert Supabase user to AuthUser
   */
  const convertUser = useCallback((supabaseUser: SupabaseUser): AuthUser => {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      displayName: supabaseUser.user_metadata?.display_name || supabaseUser.user_metadata?.displayName,
      avatarUrl: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.avatarUrl,
    };
  }, []);

  /**
   * Update user and session state
   */
  const updateSession = useCallback(
    async (session: Session | null) => {
      try {
        if (session?.user) {
          const authUser = convertUser(session.user);
          setUser(authUser);
          setSession(session);
          setError(undefined);
        } else {
          setUser(undefined);
          setSession(undefined);
          setError(undefined);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update session');
        setError(error);
        setUser(undefined);
        setSession(undefined);
      }
    },
    [convertUser]
  );

  /**
   * Initialize session on mount
   */
  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          throw new AuthError('Failed to get session', { error });
        }

        if (mounted) {
          await updateSession(session);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to initialize session'));
          setUser(undefined);
          setSession(undefined);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initSession();

    return () => {
      mounted = false;
    };
  }, [updateSession]);

  /**
   * Listen for auth state changes
   */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        await updateSession(session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [updateSession]);

  /**
   * Sign out function
   */
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      setError(undefined);

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new AuthError('Failed to sign out', { error });
      }

      setUser(undefined);
      setSession(undefined);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to sign out');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh session function
   */
  const refreshSession = useCallback(async () => {
    try {
      setError(undefined);

      const { data: { session }, error } = await supabase.auth.refreshSession();

      if (error) {
        throw new AuthError('Failed to refresh session', { error });
      }

      await updateSession(session);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to refresh session');
      setError(error);
      throw error;
    }
  }, [updateSession]);

  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth hook
 * Provides access to auth context
 * @throws {Error} If used outside AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
