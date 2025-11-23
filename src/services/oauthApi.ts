// src/services/oauthApi.ts
import { supabase } from '../lib/supabase';
import type { Json } from '../types/database.types';
// Fixed: 2025-01-24 - Eradicated 1 null usage(s) - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types


// Helper to safely extract string from Json metadata
function getMetadataString(metadata: Json | null, key: string, fallback: string): string {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return fallback;
  const value = (metadata as Record<string, Json>)[key];
  return typeof value === 'string' ? value : fallback;
}

export interface OAuthConnection {
  id: string;
  user_id: string;
  provider: 'spotify' | 'x' | 'linkedin';
  provider_user_id: string;
  display_name: string;
  profile_image?: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  connected_at: string;
}

/**
 * Get OAuth configuration for a provider
 */
export async function getOAuthConfig(provider: 'spotify' | 'x' | 'linkedin') {
  console.log(`🔵 [getOAuthConfig] Starting config fetch for ${provider}...`);

  /* ORIGINAL CODE BLOCK START */
  /*
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    console.error('❌ [getOAuthConfig] No session found!');
    throw new Error('Not authenticated');
  }

  console.log('✅ [getOAuthConfig] Session exists, user ID:', session.user?.id);
  console.log('✅ [getOAuthConfig] Session token prefix:', session.access_token?.substring(0, 20) + '...');
  */
  /* ORIGINAL CODE BLOCK END */

  // User should already be authenticated via authStore
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    console.error('❌ [getOAuthConfig] No session found');
    throw new Error('Not authenticated');
  }
  
  console.log('✅ [getOAuthConfig] Session exists');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const functionName = provider === 'x' ? 'twitter-auth' : `${provider}-auth`;
  const configUrl = `${supabaseUrl}/functions/v1/${functionName}?action=config`;

  console.log('🔵 [getOAuthConfig] Edge Function URL:', configUrl);
  console.log('🔵 [getOAuthConfig] Function name:', functionName);

  try {
    // Get client ID from Edge Function (secure)
    console.log('🔵 [getOAuthConfig] Sending fetch request...');
    /* ORIGINAL CODE START — reason: session variable doesn't exist after getUser() refactor
       Date: 2025-01-21 21:10:00
    */
    // const response = await fetch(configUrl, {
    //   headers: {
    //     'Authorization': `Bearer ${session.access_token}`,
    //     'Content-Type': 'application/json',
    //   },
    // });
    /* ORIGINAL CODE END */
    
    // FIX NOTE – Use actual session access token for Authorization
    const response = await fetch(configUrl, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('🔵 [getOAuthConfig] Response status:', response.status, response.statusText);
    console.log('🔵 [getOAuthConfig] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      // Try to get error details
      let errorDetails = 'No error details available';
      const contentType = response.headers.get('content-type');

      console.error('❌ [getOAuthConfig] Response not OK!');
      console.error('❌ [getOAuthConfig] Status:', response.status);
      console.error('❌ [getOAuthConfig] Content-Type:', contentType);

      try {
        if (contentType?.includes('application/json')) {
          const errorJson = await response.json();
          errorDetails = JSON.stringify(errorJson, null, 2);
          console.error('❌ [getOAuthConfig] JSON Error:', errorJson);
        } else {
          const errorText = await response.text();
          errorDetails = errorText.substring(0, 500); // Limit length
          console.error('❌ [getOAuthConfig] Text Error:', errorText.substring(0, 200));

          // Check if it's the Supabase "Connect to Project" page
          if (errorText.includes('Connect to project') || errorText.includes('supabase')) {
            console.error('❌ [getOAuthConfig] DETECTED: Supabase "Connect to Project" error page!');
            console.error('❌ [getOAuthConfig] This means the Edge Function cannot be reached.');
            console.error('❌ [getOAuthConfig] Possible causes:');
            console.error('   - Edge Function not deployed');
            console.error('   - Incorrect Supabase URL');
            console.error('   - Authentication/authorization issue');
            console.error('   - CORS issue');
          }
        }
      } catch (parseError) {
        console.error('❌ [getOAuthConfig] Could not parse error response:', parseError);
      }

      throw new Error(`Failed to get ${provider} configuration (${response.status}): ${errorDetails}`);
    }

    const data = await response.json();
    console.log('✅ [getOAuthConfig] Successfully received config:', data);

    if (!data.clientId) {
      console.error('❌ [getOAuthConfig] Config response missing clientId!');
      throw new Error(`Invalid config response: missing clientId`);
    }

    const config = {
      clientId: data.clientId,
      redirectUri: `${window.location.origin}/oauth/callback`,
    };

    console.log('✅ [getOAuthConfig] Final config:', config);
    return config;

  } catch (error) {
    console.error('❌ [getOAuthConfig] Fatal error during fetch:', error);
    if (error instanceof TypeError) {
      console.error('❌ [getOAuthConfig] Network error - could not reach Edge Function');
      console.error('❌ [getOAuthConfig] Check:');
      console.error('   1. Supabase URL is correct');
      console.error('   2. Edge Function is deployed');
      console.error('   3. Network connectivity');
    }
    throw error;
  }
}

/**
 * Exchange OAuth code for tokens and save connection
 */
export async function connectOAuthProvider(
  provider: 'spotify' | 'x' | 'linkedin',
  code: string,
  userId: string
): Promise<OAuthConnection> {
  console.log('🔵 [connectOAuthProvider] Starting...', { provider, userId, code: code.substring(0, 10) + '...' });
  
  /* ORIGINAL CODE BLOCK START */
  /*
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    console.error('❌ [connectOAuthProvider] No session found!');
    throw new Error('Not authenticated');
  }
  */
  /* ORIGINAL CODE BLOCK END */

  // Get session to retrieve access token
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    console.error('❌ [connectOAuthProvider] No valid session found!');
    throw new Error('Not authenticated');
  }

  console.log('✅ [connectOAuthProvider] Session valid');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const redirectUri = `${window.location.origin}/oauth/callback`;
  const functionName = provider === 'x' ? 'twitter-auth' : `${provider}-auth`;

  console.log('🔵 [connectOAuthProvider] Exchanging code for tokens...');

  // Exchange code for tokens
  const response = await fetch(
    `${supabaseUrl}/functions/v1/${functionName}?action=exchange`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ code, redirectUri }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ [connectOAuthProvider] Token exchange failed:', error);
    throw new Error(error.error || `Failed to connect ${provider}`);
  }

  const tokens = await response.json();
  console.log('✅ [connectOAuthProvider] Tokens received');

  // Get profile data based on provider
  let profileData: Record<string, unknown> = {};
  
  console.log('🔵 [connectOAuthProvider] Fetching profile data...');
  
  try {
    if (provider === 'spotify') {
      const profileResponse = await fetch('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': `Bearer ${tokens.access_token}` },
      });
      if (profileResponse.ok) {
        const data = await profileResponse.json();
        profileData = {
          provider_user_id: data.id,
          display_name: data.display_name || data.id,
          profile_image: data.images?.[0]?.url,
        };
        console.log('✅ [connectOAuthProvider] Profile data fetched:', profileData.display_name);
      } else {
        console.warn('⚠️ [connectOAuthProvider] Profile fetch failed, using defaults');
      }
    } else if (provider === 'x') {
      const profileResponse = await fetch(
        'https://api.twitter.com/2/users/me?user.fields=profile_image_url',
        {
          headers: { 'Authorization': `Bearer ${tokens.access_token}` },
        }
      );
      if (profileResponse.ok) {
        const data = await profileResponse.json();
        profileData = {
          provider_user_id: data.data.id,
          display_name: data.data.username,
          profile_image: data.data.profile_image_url,
        };
        console.log('✅ [connectOAuthProvider] Profile data fetched:', profileData.display_name);
      } else {
        console.warn('⚠️ [connectOAuthProvider] Profile fetch failed, using defaults');
      }
    } else if (provider === 'linkedin') {
      const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${tokens.access_token}` },
      });
      if (profileResponse.ok) {
        const data = await profileResponse.json();
        profileData = {
          provider_user_id: data.sub,
          display_name: data.name,
          profile_image: data.picture,
        };
        console.log('✅ [connectOAuthProvider] Profile data fetched:', profileData.display_name);
      } else {
        console.warn('⚠️ [connectOAuthProvider] Profile fetch failed, using defaults');
      }
    }
  } catch (error) {
    console.error(`⚠️ [connectOAuthProvider] Failed to fetch ${provider} profile:`, error);
    // Continue with default profile data
    profileData = {
      provider_user_id: 'unknown',
      display_name: 'Connected User',
    };
  }

  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : undefined;

  const integrationData = {
    user_id: userId,
    integration_type: provider,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || undefined,
    token_expires_at: expiresAt,
    last_refreshed_at: new Date().toISOString(),
    is_active: true,
    metadata: profileData as Record<string, string | undefined>,
  };

  console.log('🔵 [connectOAuthProvider] Deactivating any existing active integrations...');

  // Deactivate any existing active integrations for this user and provider
  const { error: deactivateError } = await supabase
    .from('user_integrations')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('integration_type', provider)
    .eq('is_active', true);

  if (deactivateError) {
    console.warn('⚠️ [connectOAuthProvider] Failed to deactivate old integrations:', deactivateError);
    // Continue anyway - upsert will handle the conflict
  } else {
    console.log('✅ [connectOAuthProvider] Old integrations deactivated');
  }

  console.log('🔵 [connectOAuthProvider] Saving to database...');

  const { data, error } = await supabase
    .from('user_integrations')
    .upsert(integrationData, {
      onConflict: 'user_id,integration_type',
    })
    .select()
    .single();

  if (error) {
    console.error('❌ [connectOAuthProvider] Database save failed:', error);
    throw error;
  }

  console.log('✅ [connectOAuthProvider] Successfully saved to database!');

  return {
    id: data.id,
    user_id: data.user_id,
    provider: data.integration_type as 'spotify' | 'x' | 'linkedin',
    provider_user_id: (profileData.provider_user_id as string) || '',
    display_name: (profileData.display_name as string) || 'Connected',
    profile_image: profileData.profile_image as string | undefined,
    access_token: data.access_token,
    /* ORIGINAL CODE START — reason: Database returns 'null' but interface expects 'string | undefined'
       Date: 2025-01-21 20:30:00
    */
    // refresh_token: data.refresh_token,
    // expires_at: data.token_expires_at,
    /* ORIGINAL CODE END */
    refresh_token: data.refresh_token || undefined, // FIX NOTE: Convert null to undefined
    expires_at: data.token_expires_at || undefined, // FIX NOTE: Convert null to undefined
    connected_at: data.created_at || new Date().toISOString(),
  };
}

/**
 * Disconnect OAuth provider
 */
export async function disconnectOAuthProvider(
  provider: 'spotify' | 'x' | 'linkedin',
  userId: string
): Promise<void> {
  /* ORIGINAL CODE BLOCK START */
  /*
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }
  */
  /* ORIGINAL CODE BLOCK END */

  /* FIX NOTE:
     - Issue: Using deprecated getSession() method (security risk)
     - Action: Replace with modern getUser() method for server-validated authentication
     - Date: 2025-01-21
  */
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  // Just mark as inactive instead of nullifying tokens (to avoid NOT NULL constraint)
  const { error } = await supabase
    .from('user_integrations')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('integration_type', provider);

  if (error) {
    throw new Error(`Failed to disconnect ${provider}`);
  }
}

/**
 * Get user's OAuth connections
 */
export async function getUserOAuthConnections(userId: string): Promise<OAuthConnection[]> {
  /* ORIGINAL CODE BLOCK START */
  /*
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return [];
  }
  */
  /* ORIGINAL CODE BLOCK END */

  /* FIX NOTE:
     - Issue: Using deprecated getSession() method (security risk)
     - Action: Replace with modern getUser() method for server-validated authentication
     - Date: 2025-01-21
  */
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    console.error('Failed to get OAuth connections:', error);
    return [];
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    user_id: item.user_id,
    provider: item.integration_type as 'spotify' | 'x' | 'linkedin',
    /* ORIGINAL CODE START — reason: Empty strings don't match OAuthConnection interface expectations
       Date: 2025-01-21 20:30:00
    */
    // provider_user_id: item.metadata?.provider_user_id || '',
    // display_name: item.metadata?.display_name || 'Connected',
    /* ORIGINAL CODE END */
    /* ORIGINAL CODE START — reason: Type mismatch - metadata fields might be objects but interface expects strings
       Date: 2025-01-21 20:30:00
    */
    // provider_user_id: item.metadata?.provider_user_id || 'unknown', // FIX NOTE: Provide valid default
    // display_name: item.metadata?.display_name || 'Connected User', // FIX NOTE: Provide valid default
    /* ORIGINAL CODE END */
    provider_user_id: getMetadataString(item.metadata, 'provider_user_id', 'unknown'),
    display_name: getMetadataString(item.metadata, 'display_name', 'Connected User'),
    /* ORIGINAL CODE START — reason: profile_image type mismatch - interface expects string but getting unknown
       Date: 2025-01-21 20:30:00
    */
    // profile_image: item.metadata?.profile_image,
    /* ORIGINAL CODE END */
    profile_image: item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata) && typeof (item.metadata as Record<string, Json>).profile_image === 'string' ? (item.metadata as Record<string, Json>).profile_image as string : undefined,
    access_token: item.access_token,
    /* ORIGINAL CODE START — reason: null values don't match interface expectations
       Date: 2025-01-21 20:30:00
    */
    // refresh_token: item.refresh_token,
    // expires_at: item.token_expires_at,
    /* ORIGINAL CODE END */
    refresh_token: item.refresh_token || undefined, // FIX NOTE: Convert null to undefined
    expires_at: item.token_expires_at || undefined, // FIX NOTE: Convert null to undefined
    connected_at: item.created_at || new Date().toISOString(),
  }));
}

/**
 * Refresh token if needed
 */
export async function refreshTokenIfNeeded(
  integration: Record<string, unknown>,
  provider: 'spotify' | 'x' | 'linkedin'
): Promise<string> {
  // Check if token is expired or about to expire (within 5 minutes)
  const expiresAt = integration.token_expires_at ? new Date(integration.token_expires_at as string) : undefined;
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  if (!expiresAt || expiresAt > fiveMinutesFromNow) {
    // Token is still valid
    return integration.access_token as string;
  }

  // Check if refresh token exists
  if (!integration.refresh_token) {
    throw new Error(`No refresh token available for ${provider}. Please reconnect your account.`);
  }

  // Token is expired or about to expire, refresh it
  /* ORIGINAL CODE BLOCK START */
  /*
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }
  */
  /* ORIGINAL CODE BLOCK END */

  // Get session to retrieve access token
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error('Not authenticated');
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const functionName = provider === 'x' ? 'twitter-auth' : `${provider}-auth`;

  const response = await fetch(
    `${supabaseUrl}/functions/v1/${functionName}?action=refresh`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ refreshToken: integration.refresh_token }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh ${provider} token: ${errorText}`);
  }

  const tokens = await response.json();
  const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  // Update token in database
  await supabase
    .from('user_integrations')
    .update({
      access_token: tokens.access_token,
      token_expires_at: newExpiresAt,
      last_refreshed_at: new Date().toISOString(),
    })
    .eq('id', integration.id as string);

  return tokens.access_token;
}

/**
 * Post to Twitter/X
 */
export async function postToTwitter(userId: string, content: string): Promise<Record<string, unknown>> {
  /* ORIGINAL CODE BLOCK START */
  /*
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }
  */
  /* ORIGINAL CODE BLOCK END */

  // Get session to retrieve access token
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error('Not authenticated');
  }

  const { data: integration } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('integration_type', 'x')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .maybeSingle();

  if (!integration?.access_token) {
    throw new Error('Twitter not connected. Please connect your Twitter/X account.');
  }

  await refreshTokenIfNeeded(integration, 'x');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const response = await fetch(`${supabaseUrl}/functions/v1/post-to-x`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ userId, content }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to post to Twitter');
  }

  return response.json();
}

/**
 * Post to LinkedIn
 */
export async function postToLinkedIn(userId: string, content: string): Promise<Record<string, unknown>> {
  /* ORIGINAL CODE BLOCK START */
  /*
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }
  */
  /* ORIGINAL CODE BLOCK END */

  // Get session to retrieve access token
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error('Not authenticated');
  }

  const { data: integration } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('integration_type', 'linkedin')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .maybeSingle();

  if (!integration?.access_token) {
    throw new Error('LinkedIn not connected. Please connect your LinkedIn account.');
  }

  await refreshTokenIfNeeded(integration, 'linkedin');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const response = await fetch(`${supabaseUrl}/functions/v1/linkedin-post`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ userId, content }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to post to LinkedIn');
  }

  return response.json();
}