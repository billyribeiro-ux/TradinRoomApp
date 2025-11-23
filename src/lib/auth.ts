// src/lib/auth.ts
// ──────────────────────────────────────────────
// Authentication utilities and functions
// ──────────────────────────────────────────────
import type { User } from '@supabase/supabase-js';

import { supabase } from './supabase';

export interface RegisterUserInput {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
}

export interface LoginWithPasswordInput {
  email: string;
  password: string;
}

export interface AuthResult<T = unknown> {
  success: boolean;
  data?: T;
  user?: User;  // For verifyOTP
  error?: string;
  serviceError?: string;
}

export interface UserData {
  user: User;
  session: unknown;
}

// ──────────────────────────────────────────────
// User Registration
// ──────────────────────────────────────────────
export async function registerUser(input: RegisterUserInput): Promise<AuthResult<UserData>> {
  try {
    console.log('[registerUser] Starting registration for:', input.email);

    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          display_name: input.displayName,
        },
      },
    });

    if (error) {
      console.error('[registerUser] Supabase error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'No user data returned',
      };
    }

    // FIXED: Create user record in users table (not profiles)
    console.log('[registerUser] Creating user record for user:', data.user.id);
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email: input.email,
        display_name: input.displayName,
        role: 'member',
      });

    if (userError) {
      console.error('[registerUser] ❌ User creation error:', userError);
      console.error('[registerUser] 🚨 CRITICAL: Registration incomplete - user exists in auth but not in database');
      console.error('[registerUser] 🚨 User will NOT be able to log in until this is fixed');
      
      // ENTERPRISE PATTERN: Rollback auth user creation if database insert fails
      try {
        await supabase.auth.admin.deleteUser(data.user.id);
        console.log('[registerUser] ✅ Rolled back auth user creation');
      } catch (rollbackError) {
        console.error('[registerUser] ❌ Failed to rollback auth user:', rollbackError);
      }
      
      return {
        success: false,
        error: 'Registration failed. Please try again or contact support.',
      };
    }
    
    console.log('[registerUser] ✅ User record created successfully');

    console.log('[registerUser] Registration successful for:', input.email);
    return {
      success: true,
      data: {
        user: data.user,
        session: data.session,
      },
    };

  } catch (error) {
    console.error('[registerUser] Registration failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed',
    };
  }
}

// ──────────────────────────────────────────────
// Password Login
// ──────────────────────────────────────────────
export async function loginWithPassword(input: LoginWithPasswordInput): Promise<AuthResult<UserData>> {
  try {
    console.log('[loginWithPassword] Starting login for:', input.email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      console.error('[loginWithPassword] Supabase error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'No user data returned',
      };
    }

    console.log('[loginWithPassword] Login successful for:', input.email);
    return {
      success: true,
      data: {
        user: data.user,
        session: data.session,
      },
    };

  } catch (error) {
    console.error('[loginWithPassword] Login failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login failed',
    };
  }
}

// ──────────────────────────────────────────────
// OTP Request
// ──────────────────────────────────────────────
export async function requestOTP(email: string): Promise<AuthResult<{ message: string }>> {
  try {
    console.log('[requestOTP] Requesting OTP for:', email);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('[requestOTP] Supabase error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('[requestOTP] OTP sent successfully to:', email);
    return {
      success: true,
      data: {
        message: 'OTP sent successfully',
      },
    };

  } catch (error) {
    console.error('[requestOTP] OTP request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'OTP request failed',
    };
  }
}

// ──────────────────────────────────────────────
// OTP Verification
// ──────────────────────────────────────────────
export async function verifyOTP(email: string, token: string): Promise<AuthResult<{ user: User }>> {
  try {
    console.log('[verifyOTP] Verifying OTP for:', email);

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      console.error('[verifyOTP] Supabase error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'No user data returned',
      };
    }

    console.log('[verifyOTP] OTP verification successful for:', email);
    return {
      success: true,
      user: data.user,
    };

  } catch (error) {
    console.error('[verifyOTP] OTP verification failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'OTP verification failed',
    };
  }
}

// ──────────────────────────────────────────────
// Password Reset
// ──────────────────────────────────────────────
export async function requestPasswordReset(email: string): Promise<AuthResult<{ message: string }>> {
  try {
    console.log('[requestPasswordReset] Requesting password reset for:', email);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    if (error) {
      console.error('[requestPasswordReset] Supabase error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('[requestPasswordReset] Password reset email sent to:', email);
    return {
      success: true,
      data: {
        message: 'Password reset email sent',
      },
    };

  } catch (error) {
    console.error('[requestPasswordReset] Password reset request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Password reset request failed',
    };
  }
}

// ──────────────────────────────────────────────
// Resend Verification Email
// ──────────────────────────────────────────────
export async function resendVerificationEmail(email: string): Promise<AuthResult<{ message: string }>> {
  try {
    console.log('[resendVerificationEmail] Resending verification for:', email);

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('[resendVerificationEmail] Supabase error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('[resendVerificationEmail] Verification email resent to:', email);
    return {
      success: true,
      data: {
        message: 'Verification email resent',
      },
    };

  } catch (error) {
    console.error('[resendVerificationEmail] Resend verification failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Resend verification failed',
    };
  }
}

// ──────────────────────────────────────────────
// Sign Out
// ──────────────────────────────────────────────
export async function signOut(): Promise<AuthResult<{ message: string }>> {
  try {
    console.log('[signOut] Signing out user');

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[signOut] Supabase error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('[signOut] Sign out successful');
    return {
      success: true,
      data: {
        message: 'Sign out successful',
      },
    };

  } catch (error) {
    console.error('[signOut] Sign out failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Sign out failed',
    };
  }
}

// ──────────────────────────────────────────────
// Validation Functions
// ──────────────────────────────────────────────
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!password) {
    errors.push('Password is required');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateDisplayName(displayName: string): { valid: boolean; error?: string } {
  if (!displayName) {
    return { valid: false, error: 'Display name is required' };
  }

  if (displayName.length < 2) {
    return { valid: false, error: 'Display name must be at least 2 characters long' };
  }

  if (displayName.length > 50) {
    return { valid: false, error: 'Display name must be less than 50 characters' };
  }

  return { valid: true };
}

export function validatePasswordMatch(password: string, confirmPassword: string): { valid: boolean; error?: string } {
  if (password !== confirmPassword) {
    return { valid: false, error: 'Passwords do not match' };
  }

  return { valid: true };
}

// ──────────────────────────────────────────────
// Error Display Info
// ──────────────────────────────────────────────
export function getErrorDisplayInfo(error: string): { message: string; type: 'error' | 'warning' | 'info' } {
  const errorMap: Record<string, { message: string; type: 'error' | 'warning' | 'info' }> = {
    'Invalid login credentials': {
      message: 'Invalid email or password. Please check your credentials and try again.',
      type: 'error',
    },
    'Email not confirmed': {
      message: 'Please check your email and click the verification link before logging in.',
      type: 'warning',
    },
    'User already registered': {
      message: 'An account with this email already exists. Please try logging in instead.',
      type: 'info',
    },
    'Password should be at least 8 characters': {
      message: 'Password must be at least 8 characters long.',
      type: 'error',
    },
    'Signup requires a valid password': {
      message: 'Please enter a valid password.',
      type: 'error',
    },
  };

  return errorMap[error] || { message: error, type: 'error' };
}