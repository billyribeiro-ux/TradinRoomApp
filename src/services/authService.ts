// Added: 2025-01-24 - Claude/Cursor - Comprehensive auth service with enhanced error handling and user management
import type { User, Session } from '@supabase/supabase-js';

import { supabase } from '../lib/supabase';
// Fixed: 2025-01-24 - Enhanced null eradication - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types

// Fixed: 2025-01-24 - Eradicated 7 null usage(s) - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types


// Added: 2025-01-24 - Type definitions for auth operations
export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  displayName: string;
}

export interface AuthResponse {
  user: User | undefined;
  session: Session | undefined;
  error: Error | undefined;
}

export interface ProfileResponse {
  profile: Record<string, unknown> | undefined;
  error: Error | undefined;
}

// Added: 2025-01-24 - Error severity levels for centralized reporting
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Added: 2025-01-24 - Centralized error reporting utility
export function reportError(
  error: Error | string,
  severity: ErrorSeverity,
  context?: {
    component?: string;
    action?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  }
): void {
  const errorMessage = error instanceof Error ? error.message : error;
  const timestamp = new Date().toISOString();
  
  // Log with appropriate console method
  const logMethod = severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.HIGH
    ? console.error
    : severity === ErrorSeverity.MEDIUM
    ? console.warn
    : console.log;
  
  logMethod(
    `[ERROR ${severity.toUpperCase()}] ${timestamp}`,
    errorMessage,
    context || {},
    error instanceof Error ? error.stack : ''
  );
  
  // TODO: Send to external service (Sentry, LogRocket, etc.)
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
        console.error(`[retryOperation] All ${maxRetries} attempts failed`);
        throw lastError;
      }
      
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.warn(
        `[retryOperation] Attempt ${attempt} failed, retrying in ${delay}ms...`,
        lastError.message
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

class AuthService {
  // Added: 2025-01-24 - Enhanced sign in with retry logic and error reporting
  async signIn({ email, password }: SignInCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await retryOperation(async () => {
        const result = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (result.error) throw result.error;
        return result;
      });

      if (error) throw error;

      // ENTERPRISE PATTERN: Validate user profile exists (no auto-creation)
      if (data.user) {
        await this.validateUserProfile(data.user);
      }

      // ENTERPRISE PATTERN: Enforce email verification
      if (data.user && !data.user.email_confirmed_at) {
        console.error('[AuthService] ❌ Email not verified');
        await supabase.auth.signOut();
        throw new Error('Please verify your email before logging in. Check your inbox and spam folder.');
      }

      return { user: data.user, session: data.session, error: undefined };
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), ErrorSeverity.HIGH, {
        component: 'AuthService',
        action: 'signIn',
        metadata: { email }
      });
      return {
        user: undefined,
        session: undefined,
        error: error instanceof Error ? error : new Error('Sign in failed'),
      };
    }
  }

  // Added: 2025-01-24 - Enhanced sign up with profile creation
  async signUp({ email, password, displayName }: SignUpCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await retryOperation(async () => {
        const result = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
            }
          }
        });
        if (result.error) throw result.error;
        return result;
      });

      if (error) throw error;

      // Added: 2025-01-24 - Create user profile after successful signup
      if (data.user) {
        await this.createUserProfile(data.user, displayName);
      }

      return { user: data.user || undefined, session: data.session || undefined, error: undefined };
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), ErrorSeverity.HIGH, {
        component: 'AuthService',
        action: 'signUp',
        metadata: { email, displayName }
      });
      return {
        user: undefined,
        session: undefined,
        error: error instanceof Error ? error : new Error('Sign up failed'),
      };
    }
  }

  // Added: 2025-01-24 - Get user profile from public.users table
  async getUserProfile(userId: string): Promise<ProfileResponse> {
    try {
      const { data, error } = await retryOperation(async () => {
        const result = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        if (result.error) throw result.error;
        return result;
      });

      if (error) throw error;
      return { profile: data, error: undefined };
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), ErrorSeverity.MEDIUM, {
        component: 'AuthService',
        action: 'getUserProfile',
        userId
      });
      return {
        profile: undefined,
        error: error instanceof Error ? error : new Error('Failed to get profile'),
      };
    }
  }

  /**
   * ENTERPRISE PATTERN: Validate user profile exists (Microsoft/Google standard)
   * NEVER auto-creates - registration must be explicit
   * Throws error if user record missing (incomplete registration)
   */
  private async validateUserProfile(authUser: User): Promise<void> {
    try {
      const { data: existingProfile, error } = await supabase
        .from('users')
        .select('id, email, role, display_name')
        .eq('id', authUser.id)
        .single();

      if (error || !existingProfile) {
        console.error('[AuthService] ❌ User record not found in database');
        console.error('[AuthService] 🚨 This indicates incomplete registration');
        console.error('[AuthService] 🚨 User exists in auth.users but not in public.users');
        throw new Error('Account not found. Please complete registration or contact support.');
      }

      console.log('[AuthService] ✅ User profile validated:', existingProfile.email);
      
      // Update last activity timestamp only
      await supabase
        .from('users')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', authUser.id);
        
    } catch (error) {
      if (error instanceof Error && error.message.includes('Account not found')) {
        throw error; // Re-throw validation errors
      }
      reportError(error instanceof Error ? error : new Error(String(error)), ErrorSeverity.HIGH, {
        component: 'AuthService',
        action: 'validateUserProfile',
        userId: authUser.id
      });
      throw new Error('Failed to validate user account. Please try again.');
    }
  }

  // Added: 2025-01-24 - Create user profile in database
  private async createUserProfile(authUser: User, displayName?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email || '',
          display_name: displayName || authUser.user_metadata?.display_name || 'User',
          role: 'member', // Default role
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), ErrorSeverity.HIGH, {
        component: 'AuthService',
        action: 'createUserProfile',
        userId: authUser.id
      });
      throw error;
    }
  }

  // Added: 2025-01-24 - Refresh current session to prevent timeout
  async refreshSession(): Promise<{ session: Session | undefined; error?: Error }> {
    try {
      const { data, error } = await retryOperation(async () => {
        const result = await supabase.auth.refreshSession();
        if (result.error) throw result.error;
        return result;
      });

      if (error) throw error;
      return { session: data.session || undefined, error: undefined };
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), ErrorSeverity.MEDIUM, {
        component: 'AuthService',
        action: 'refreshSession'
      });
      return {
        session: undefined,
        error: error instanceof Error ? error : new Error('Failed to refresh session'),
      };
    }
  }

  // Added: 2025-01-24 - Sign out with cleanup
  async signOut(): Promise<{ error?: Error }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: undefined };
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), ErrorSeverity.MEDIUM, {
        component: 'AuthService',
        action: 'signOut'
      });
      return {
        error: error instanceof Error ? error : new Error('Sign out failed'),
      };
    }
  }

  // Added: 2025-01-24 - Get current user
  async getCurrentUser(): Promise<{ user: User | undefined; error?: Error }> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { user: user || undefined, error: undefined };
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), ErrorSeverity.LOW, {
        component: 'AuthService',
        action: 'getCurrentUser'
      });
      return {
        user: undefined,
        error: error instanceof Error ? error : new Error('Failed to get current user'),
      };
    }
  }

  // Added: 2025-01-24 - Reset password
  async resetPassword(email: string): Promise<{ error?: Error }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return { error: undefined };
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), ErrorSeverity.MEDIUM, {
        component: 'AuthService',
        action: 'resetPassword',
        metadata: { email }
      });
      return {
        error: error instanceof Error ? error : new Error('Failed to send reset email'),
      };
    }
  }
}

// Added: 2025-01-24 - Export singleton instance
export const authService = new AuthService();
export default authService;
