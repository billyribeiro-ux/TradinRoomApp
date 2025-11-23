// Spotify OAuth Edge Function
// Handles Spotify OAuth configuration and token exchange
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    // Spotify credentials
    const spotifyClientId = '17dbd0f3c4f04d8ca8000335bcd1b0ad'
    const spotifyClientSecret = '2f9380902f73431b84df5b2b05d2dee1'

    // Action: Get OAuth config (client ID and redirect URI)
    if (action === 'config') {
      // Get origin from request header (supports production and development)
      // For local dev, you'll need to use ngrok, localtunnel, or similar
      const origin = req.headers.get('origin') || 'https://your-production-domain.com'
      
      return new Response(
        JSON.stringify({
          clientId: spotifyClientId,
          redirectUri: `${origin}/oauth/callback`,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Action: Exchange authorization code for tokens
    if (action === 'exchange') {
      const { code, redirectUri } = await req.json()

      if (!code || !redirectUri) {
        throw new Error('Missing code or redirectUri')
      }

      // Exchange code for access token
      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${spotifyClientId}:${spotifyClientSecret}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }),
      })

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text()
        throw new Error(`Token exchange failed: ${error}`)
      }

      const tokens = await tokenResponse.json()

      // Get user profile
      const profileResponse = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
        },
      })

      const profile = await profileResponse.json()

      return new Response(
        JSON.stringify({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_in: tokens.expires_in,
          profile: {
            id: profile.id,
            display_name: profile.display_name,
            email: profile.email,
            images: profile.images,
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Action: Refresh access token
    if (action === 'refresh') {
      const { refreshToken } = await req.json()

      if (!refreshToken) {
        throw new Error('Missing refreshToken')
      }

      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${spotifyClientId}:${spotifyClientSecret}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      })

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text()
        throw new Error(`Token refresh failed: ${error}`)
      }

      const tokens = await tokenResponse.json()

      return new Response(
        JSON.stringify({
          access_token: tokens.access_token,
          expires_in: tokens.expires_in,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    throw new Error('Invalid action')

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})