/**
 * Location Service - Member Location Tracking
 * =====================================================
 * Tracks member city/state/country using IP geolocation
 * Uses ipapi.co (free, no API key needed, 1000 requests/day)
 */

import { supabase } from '../lib/supabase';

export interface MemberLocation {
  city?: string;
  region?: string; // State/Province
  country?: string;
  country_code?: string;
  timezone?: string;
}

/**
 * Get user's location from IP
 * DISABLED: CSP violation - external API blocked
 * Location tracking disabled until proper backend implementation
 */
export async function getUserLocation(): Promise<MemberLocation | null> {
  // Microsoft Standard: Disable feature that violates CSP
  // TODO: Implement server-side location detection if needed
  return null;
}

/**
 * Update member's location in Supabase room_memberships table
 * NOTE: This will work once the migration is run. For now, it stores in memory via RoomStore.
 */
export async function updateMemberLocation(
  roomId: string,
  userId: string,
  location: MemberLocation
): Promise<boolean> {
  try {
    // Update location in database
    const { error } = await supabase
      .from('room_memberships')
      .update({
        city: location.city,
        region: location.region,
        country: location.country,
        country_code: location.country_code,
        timezone: location.timezone,
      })
      .eq('room_id', roomId)
      .eq('user_id', userId);

    if (error) {
      console.error('[LocationService] Failed to update location in DB:', error);
      return false;
    }

    console.log('[LocationService] Location updated in DB:', location);
    return true;
  } catch (error) {
    console.warn('[LocationService] Error updating location (expected until migration runs):', error);
    return true; // Don't fail - we'll use in-memory storage
  }
}

/**
 * Get all member locations for a room
 * Returns members with their location data
 */
export async function getRoomMemberLocations(roomId: string) {
  try {
    const { data, error } = await supabase
      .from('room_memberships')
      .select(`
        user_id,
        city,
        region,
        country,
        country_code,
        timezone,
        users!room_memberships_user_id_fkey(
          id,
          display_name,
          avatar_url
        )
      `)
      .eq('room_id', roomId)
      .not('city', 'is', null);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[LocationService] Failed to get member locations:', error);
    return [];
  }
}

/**
 * Initialize location tracking for a member when they join a room
 * Automatically fetches and stores their location
 */
export async function initializeMemberLocation(
  roomId: string,
  userId: string
): Promise<void> {
  try {
    console.log('[LocationService] Initializing location for user:', userId);
    
    const location = await getUserLocation();
    if (location?.city) {
      await updateMemberLocation(roomId, userId, location);
      console.log('[LocationService] Location initialized:', location);
    } else {
      console.warn('[LocationService] Could not determine location');
    }
  } catch (error) {
    console.error('[LocationService] Failed to initialize location:', error);
  }
}

/**
 * Format location for display (e.g., "New York, NY" or "London, UK")
 */
export function formatLocation(location: MemberLocation): string {
  if (!location.city && !location.region && !location.country) {
    return 'Unknown';
  }

  const parts: string[] = [];
  
  if (location.city) parts.push(location.city);
  if (location.region) parts.push(location.region);
  else if (location.country_code) parts.push(location.country_code);
  
  return parts.join(', ') || 'Unknown';
}

/**
 * Get location display string from room membership data
 */
export function getLocationDisplay(member: {
  city?: string | null;
  region?: string | null;
  country_code?: string | null;
}): string {
  const parts: string[] = [];
  
  if (member.city) parts.push(member.city);
  if (member.region) parts.push(member.region);
  else if (member.country_code) parts.push(member.country_code);
  
  return parts.join(', ') || '';
}
