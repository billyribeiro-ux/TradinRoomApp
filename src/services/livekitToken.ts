// src/services/livekitToken.ts
// ──────────────────────────────────────────────
// LiveKit token generation via Supabase Edge Function
// ──────────────────────────────────────────────
import { supabase } from '../lib/supabase';

export interface LiveKitTokenRequest {
  roomName: string;
  participantIdentity: string;
  participantName: string;
  participantRole: 'host' | 'moderator' | 'member';
}

export interface LiveKitTokenResponse {
  token: string;
  serverUrl: string;
  roomName: string;
  participantIdentity: string;
  expiresAt: number;
}

export interface LiveKitTokenError {
  error: string;
  message: string;
  code?: string;
}

// ──────────────────────────────────────────────
// Get LiveKit token from Supabase Edge Function
// ──────────────────────────────────────────────
export async function getLiveKitToken(
  roomName: string,
  participantIdentity: string,
  participantName: string,
  participantRole: 'host' | 'moderator' | 'member' = 'member'
): Promise<string> {
  try {
    console.log('[getLiveKitToken] Requesting token for:', {
      roomName,
      participantIdentity,
      participantName,
      participantRole,
    });

    const { data, error } = await supabase.functions.invoke('generate-livekit-token', {
      body: {
        roomName,
        participantIdentity,
        participantName,
        participantRole,
      },
    });

    if (error) {
      // Only log error in development for debugging if enabled via env flag
      if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_LIVEKIT === 'true') {
        console.warn('[getLiveKitToken] LiveKit service unavailable:', error.message);
      }
      throw new Error(`Failed to generate LiveKit token: ${error.message}`);
    }

    if (!data?.token) {
      throw new Error('No token received from LiveKit service');
    }

    // Quiet success - only log in production
    if (!import.meta.env.DEV) {
      console.log('[getLiveKitToken] Token generated successfully');
    }
    return data.token;

  } catch (error) {
    // Only log detailed errors in production or critical errors
    if (!import.meta.env.DEV || (error as Error).message?.includes('500') || (error as Error).message?.includes('503')) {
      console.error('[getLiveKitToken] Token generation failed:', error);
    }
    throw error;
  }
}

// ──────────────────────────────────────────────
// Validate LiveKit token
// ──────────────────────────────────────────────
export function validateLiveKitToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  try {
    // Basic JWT structure validation
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Decode payload to check expiration
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    
    if (payload.exp && payload.exp < now) {
      console.warn('[validateLiveKitToken] Token has expired');
      return false;
    }

    return true;
  } catch (error) {
    console.error('[validateLiveKitToken] Token validation failed:', error);
    return false;
  }
}

// ──────────────────────────────────────────────
// Get LiveKit server URL from environment
// ──────────────────────────────────────────────
export function getLiveKitServerUrl(): string {
  const serverUrl = import.meta.env.VITE_LIVEKIT_URL;
  
  if (!serverUrl) {
    throw new Error('LiveKit server URL not configured. Please set VITE_LIVEKIT_URL environment variable.');
  }

  return serverUrl;
}

// ──────────────────────────────────────────────
// Check if LiveKit is enabled
// ──────────────────────────────────────────────
export function isLiveKitEnabled(): boolean {
  return !!import.meta.env.VITE_LIVEKIT_URL;
}

// ──────────────────────────────────────────────
// Get LiveKit configuration
// ──────────────────────────────────────────────
export function getLiveKitConfig(): { serverUrl: string; enabled: boolean } {
  return {
    serverUrl: import.meta.env.VITE_LIVEKIT_URL || '',
    enabled: isLiveKitEnabled(),
  };
}