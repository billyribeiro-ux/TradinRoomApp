import { DatabaseError } from '../lib/errors';
import { supabase, withAuth } from '../lib/supabase';
import type { Json } from '../types/database.types';
// Fixed: 2025-01-24 - Eradicated 7 null usage(s) - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types
// Fixed: 2025-10-26 - Added auth session validation to prevent 403 errors


export interface UserIntegration {
  id: string;
  user_id: string;
  integration_type: 'spotify' | 'x' | 'linkedin';
  access_token: string | undefined;
  refresh_token: string | undefined;
  token_expires_at: string | undefined;
  connected_at: string;
  last_refreshed_at: string | undefined;
  is_active: boolean;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export async function getUserIntegrations(userId: string): Promise<UserIntegration[]> {
  return withAuth(async (client) => {
    const { data, error } = await client
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      throw new DatabaseError('Failed to fetch user integrations', error, { userId });
    }

  /* ORIGINAL CODE START — reason: Database query returns data missing 'connected_at' field required by UserIntegration interface
     Date: 2025-01-21 20:30:00
  */
  // return data || [];
  /* ORIGINAL CODE END */

    // FIX NOTE: Add missing 'connected_at' field to match UserIntegration interface
    return (data || []).map((integration: unknown) => {
      const int = integration as Record<string, unknown>;
      return {
        ...int,
        connected_at: (int.connected_at || int.created_at) as string
      };
    }) as UserIntegration[];
  });
}

export async function getUserIntegration(
  userId: string,
  integrationType: 'spotify' | 'x' | 'linkedin'
): Promise<UserIntegration | undefined> {
  try {
    return await withAuth(async (client) => {
      const { data, error } = await client
        .from('user_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('integration_type', integrationType)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        throw new DatabaseError(`Failed to fetch ${integrationType} integration`, error, { userId, integrationType });
      }

      if (!data) return undefined;

      // FIX NOTE – TS2339 property corrected: Use created_at as connected_at since property doesn't exist
      return {
        ...data,
        connected_at: data.created_at
      } as UserIntegration;
    });
  } catch {
    // Gracefully return undefined if not authenticated or query fails
    return undefined;
  }
}

export async function upsertUserIntegration(
  userId: string,
  integrationType: 'spotify' | 'x' | 'linkedin',
  tokens: {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  },
  metadata?: Json
): Promise<UserIntegration> {
  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : undefined;

  const integrationData = {
    user_id: userId,
    integration_type: integrationType,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || undefined,
    token_expires_at: expiresAt,
    last_refreshed_at: new Date().toISOString(),
    is_active: true,
    metadata: metadata || {},
    /* ORIGINAL CODE START — reason: Missing 'connected_at' field required by UserIntegration interface
       Date: 2025-01-21 20:30:00
    */
    // connected_at: new Date().toISOString(),
    /* ORIGINAL CODE END */
    connected_at: new Date().toISOString(), // FIX NOTE: Add required field
  };

  const { data, error } = await supabase
    .from('user_integrations')
    .upsert(integrationData, {
      onConflict: 'user_id,integration_type',
    })
    .select()
    .single();

  if (error) {
    console.error(`Error upserting ${integrationType} integration:`, error);
    throw error;
  }

  /* ORIGINAL CODE START — reason: data object missing connected_at property required by UserIntegration interface
     Date: 2025-01-21 21:20:00
  */
  // return data;
  /* ORIGINAL CODE END */
  
  // FIX NOTE – TS2741 property missing corrected: Add missing connected_at property
  return { 
    ...data, 
    connected_at: (data as Record<string, unknown>).connected_at as string || new Date().toISOString() 
  } as UserIntegration;
}

export async function disconnectUserIntegration(
  userId: string,
  integrationType: 'spotify' | 'x' | 'linkedin'
): Promise<void> {
  const { error } = await supabase
    .from('user_integrations')
    .update({
      is_active: false,
      access_token: undefined, // FIX NOTE: Use undefined instead of null
      refresh_token: undefined, // FIX NOTE: Use undefined instead of null
    })
    .eq('user_id', userId)
    .eq('integration_type', integrationType);

  if (error) {
    console.error(`Error disconnecting ${integrationType} integration:`, error);
    throw error;
  }
}

export async function refreshIntegrationToken(
  userId: string,
  integrationType: 'spotify' | 'x' | 'linkedin',
  newAccessToken: string,
  expiresIn?: number
): Promise<void> {
  const expiresAt = expiresIn
    ? new Date(Date.now() + expiresIn * 1000).toISOString()
    : undefined;

  const { error } = await supabase
    .from('user_integrations')
    .update({
      access_token: newAccessToken,
      token_expires_at: expiresAt,
      last_refreshed_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('integration_type', integrationType);

  if (error) {
    console.error(`Error refreshing ${integrationType} token:`, error);
    throw error;
  }
}