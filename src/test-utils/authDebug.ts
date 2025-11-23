/**
 * authDebug.ts
 * ------------------------------------------------------------
 * Auth debugging utilities
 * Used to diagnose authentication state and RLS issues
 * Only logs in development mode
 */

import type { Session, User } from '@supabase/supabase-js';

import { AuthError, RLSError } from './errors';
import { supabase } from './supabase';

/**
 * Check if we're in development mode
 */
const isDev = () => import.meta.env.DEV;

/**
 * Log a debug message only in development
 */
const debugLog = (message: string, data?: unknown) => {
  if (isDev()) {
    console.log(`[Auth Debug] ${message}`, data || '');
  }
};

/**
 * Get current auth session and validate it
 * @throws {AuthError} If session is invalid or missing
 */
export async function getValidatedSession(): Promise<Session> {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    debugLog('Session error:', error);
    throw new AuthError('Failed to get session', { error });
  }

  if (!session) {
    debugLog('No session found');
    throw new AuthError('No active session');
  }

  if (!session.user) {
    debugLog('Session missing user');
    throw new AuthError('Session user is missing');
  }

  debugLog('Session validated', {
    userId: session.user.id,
    email: session.user.email,
    expiresAt: session.expires_at,
  });

  return session;
}

/**
 * Get current user ID
 * @throws {AuthError} If user is not authenticated
 */
export async function getCurrentUserId(): Promise<string> {
  const session = await getValidatedSession();
  return session.user.id;
}

/**
 * Get current user object
 * @throws {AuthError} If user is not authenticated
 */
export async function getCurrentUser(): Promise<User> {
  const session = await getValidatedSession();
  return session.user;
}

/**
 * Check if user is currently authenticated
 * Returns false instead of throwing
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    await getValidatedSession();
    return true;
  } catch {
    return false;
  }
}

/**
 * Test RLS policy on a table
 * @param tableName - Name of the table to test
 * @param operation - Operation to test (SELECT, INSERT, UPDATE, DELETE)
 * @throws {RLSError} If RLS policy denies access
 */
export async function testRLSPolicy(
  tableName: string,
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
): Promise<boolean> {
  if (!isDev()) {
    return true; // Skip in production
  }

  try {
    debugLog(`Testing RLS policy on ${tableName} for ${operation}`);

    const userId = await getCurrentUserId();

    switch (operation) {
      case 'SELECT': {
        const { error } = await supabase.from(tableName as never).select('*').limit(1);
        if (error) {
          throw new RLSError(
            `RLS policy denied SELECT on ${tableName}`,
            tableName,
            'SELECT',
            { userId, error }
          );
        }
        return true;
      }

      case 'UPDATE': {
        // Test with a dummy ID (won't actually update anything)
        const { error } = await supabase
          .from(tableName as never)
          .update({ updated_at: new Date().toISOString() } as never)
          .eq('id', '00000000-0000-0000-0000-000000000000');
        // Don't throw on error for UPDATE test
        debugLog(`UPDATE test result:`, error?.message || 'Success');
        return !error || !error.message.includes('permission');
      }

      case 'DELETE': {
        // Test with a dummy ID (won't actually delete anything)
        const { error } = await supabase
          .from(tableName as never)
          .delete()
          .eq('id', '00000000-0000-0000-0000-000000000000');
        // Don't throw on error for DELETE test
        debugLog(`DELETE test result:`, error?.message || 'Success');
        return !error || !error.message.includes('permission');
      }

      case 'INSERT':
        // Skip INSERT test as it would create test data
        debugLog('Skipping INSERT test (would create data)');
        return true;

      default:
        return false;
    }
  } catch (error) {
    debugLog(`RLS test failed for ${tableName}:`, error);
    throw error;
  }
}

/**
 * Diagnose current auth state
 * Logs comprehensive auth information for debugging
 */
export async function diagnoseAuthState(): Promise<void> {
  if (!isDev()) return;

  console.group('[Auth Diagnose] Starting diagnosis...');

  try {
    // Check session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[Auth Diagnose] Session error:', sessionError);
      console.groupEnd();
      return;
    }

    if (!session) {
      console.warn('[Auth Diagnose] No session found');
      console.groupEnd();
      return;
    }

    console.log('[Auth Diagnose] Session:', {
      userId: session.user.id,
      email: session.user.email,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'N/A',
      tokenType: session.token_type,
    });

    // Check user metadata
    console.log('[Auth Diagnose] User metadata:', session.user.user_metadata);

    // Check access token
    if (session.access_token) {
      console.log('[Auth Diagnose] Access token present:', {
        length: session.access_token.length,
        startsWith: session.access_token.substring(0, 20) + '...',
      });
    } else {
      console.warn('[Auth Diagnose] No access token in session');
    }

    // FIXED: Test connection using 'users' table instead of 'profiles'
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('[Auth Diagnose] Test query failed:', testError);
    } else {
      console.log('[Auth Diagnose] Test query successful:', testData);
    }
  } catch (error) {
    console.error('[Auth Diagnose] Error during diagnosis:', error);
  }

  console.groupEnd();
}

/**
 * Clear auth state (for debugging only)
 */
export async function clearAuthState(): Promise<void> {
  if (!isDev()) {
    throw new Error('clearAuthState can only be called in development');
  }

  debugLog('Clearing auth state');
  await supabase.auth.signOut();
  debugLog('Auth state cleared');
}