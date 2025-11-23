/** Admin verification hook with caching and concurrency control */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface UseAdminVerificationParams {
  userId: string | undefined;
  roomId: string | undefined;
}

interface UseAdminVerificationResult {
  isAdmin: boolean;
  isVerifying: boolean;
  lastError: string | undefined;
  verify: () => Promise<boolean>;
}

interface CacheEntry {
  isAdmin: boolean;
  timestamp: number;
}

// In-memory cache: key = `${userId}:${roomId}`
const cache = new Map<string, CacheEntry>();
// Test-only helper to reset cache between unit tests
export function __resetAdminVerificationCacheForTests__() {
  cache.clear();
}
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Hook for verifying admin status with caching and concurrency control.
 * 
 * Features:
 * - In-memory caching (5 min TTL)
 * - Prevents duplicate concurrent verification calls
 * - Re-verifies when userId or roomId changes
 * - Exposes verification status and errors
 * 
 * @param params - User ID and room ID
 * @returns Admin status, verification state, and verify function
 */
export function useAdminVerification({
  userId,
  roomId,
}: UseAdminVerificationParams): UseAdminVerificationResult {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastError, setLastError] = useState<string | undefined>();
  
  // Concurrency control
  const verifyReqId = useRef(0);
  const isVerifyingRef = useRef(false);

  const verify = useCallback(async (): Promise<boolean> => {
    if (!userId || !roomId) {
      setIsAdmin(false);
      setLastError('Missing user or room context');
      return false;
    }

    // Prevent duplicate concurrent calls
    if (isVerifyingRef.current) {
      return isAdmin;
    }

    const cacheKey = `${userId}:${roomId}`;
    
    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setIsAdmin(cached.isAdmin);
      setLastError(undefined);
      return cached.isAdmin;
    }

    // Concurrency control: latest-wins
    const reqId = ++verifyReqId.current;
    isVerifyingRef.current = true;
    setIsVerifying(true);
    setLastError(undefined);

    try {
      const { data, error } = await supabase
        .from('room_memberships')
        .select('id, room_id, user_id, role, joined_at')
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .single();

      // Check if this is still the latest request
      if (reqId !== verifyReqId.current) {
        return isAdmin; // Superseded
      }

      if (error || !data) {
        setLastError('No membership found');
        setIsAdmin(false);
        return false;
      }

      const membershipData = data as { role: string; joined_at: string };
      const isAdminRole = membershipData.role === 'admin';

      // Verify account age (1 hour minimum)
      const joinedAt = new Date(membershipData.joined_at).getTime();
      const accountAge = Date.now() - joinedAt;
      
      if (Number.isFinite(joinedAt) && accountAge < 60 * 60 * 1000) {
        setLastError('Admin account must be at least 1 hour old');
        setIsAdmin(false);
        return false;
      }

      // Cache result
      cache.set(cacheKey, {
        isAdmin: isAdminRole,
        timestamp: Date.now(),
      });

      setIsAdmin(isAdminRole);
      setLastError(undefined);
      return isAdminRole;
    } catch (err) {
      if (reqId !== verifyReqId.current) {
        return isAdmin; // Superseded
      }

      const errorMessage = err instanceof Error ? err.message : 'Verification failed';
      setLastError(errorMessage);
      setIsAdmin(false);
      return false;
    } finally {
      if (reqId === verifyReqId.current) {
        setIsVerifying(false);
        isVerifyingRef.current = false;
      }
    }
  }, [userId, roomId, isAdmin]);

  // Auto-verify when userId or roomId changes
  useEffect(() => {
    verify();
  }, [verify]);

  return {
    isAdmin,
    isVerifying,
    lastError,
    verify,
  };
}
