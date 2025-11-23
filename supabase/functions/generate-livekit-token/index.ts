// =========================================================
// Supabase Edge Function: generate-livekit-token
// Purpose: Generate LiveKit access tokens with proper CORS
// Location: supabase/functions/generate-livekit-token/index.ts
// =========================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { AccessToken } from "https://esm.sh/livekit-server-sdk@2.6.0";

// =========================================================
// CORS Headers - Critical for localhost development
// =========================================================
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// =========================================================
// Environment Variables (Set in Supabase Dashboard)
// =========================================================
const LIVEKIT_API_KEY = Deno.env.get('LIVEKIT_API_KEY');
const LIVEKIT_API_SECRET = Deno.env.get('LIVEKIT_API_SECRET');
const LIVEKIT_URL = Deno.env.get('LIVEKIT_URL');

// =========================================================
// Request Type Definition
// =========================================================
interface TokenRequest {
  roomName: string;
  participantIdentity: string;
  participantName: string;
  participantRole?: 'host' | 'moderator' | 'member';
}

// =========================================================
// Main Handler
// =========================================================
serve(async (req: Request) => {
  // ═══════════════════════════════════════════════════════
  // Handle CORS Preflight (OPTIONS)
  // ═══════════════════════════════════════════════════════
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    });
  }

  // ═══════════════════════════════════════════════════════
  // Validate HTTP Method
  // ═══════════════════════════════════════════════════════
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405 
      }
    );
  }

  try {
    // ═══════════════════════════════════════════════════════
    // Validate Environment Variables
    // ═══════════════════════════════════════════════════════
    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
      console.error('[LiveKit Token] Missing environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'LiveKit configuration missing',
          details: 'Check LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and LIVEKIT_URL in Supabase secrets'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    // ═══════════════════════════════════════════════════════
    // Parse Request Body
    // ═══════════════════════════════════════════════════════
    const body: TokenRequest = await req.json();
    const { roomName, participantIdentity, participantName, participantRole = 'member' } = body;

    // Validate required fields
    if (!roomName || !participantIdentity || !participantName) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          required: ['roomName', 'participantIdentity', 'participantName']
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    console.log('[LiveKit Token] Generating token for:', {
      roomName,
      participantIdentity,
      participantName,
      participantRole
    });

    // ═══════════════════════════════════════════════════════
    // Create LiveKit Access Token
    // ═══════════════════════════════════════════════════════
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantIdentity,
      name: participantName,
    });

    // ═══════════════════════════════════════════════════════
    // Set Permissions Based on Role
    // ═══════════════════════════════════════════════════════
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
      canUpdateOwnMetadata: participantRole === 'host' || participantRole === 'moderator',
    });

    // ═══════════════════════════════════════════════════════
    // Generate JWT Token
    // ═══════════════════════════════════════════════════════
    const token = await at.toJwt();

    console.log('[LiveKit Token] Token generated successfully');

    // ═══════════════════════════════════════════════════════
    // Return Success Response
    // ═══════════════════════════════════════════════════════
    return new Response(
      JSON.stringify({ 
        token,
        url: LIVEKIT_URL,
        participantIdentity,
        roomName
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200 
      }
    );

  } catch (error) {
    // ═══════════════════════════════════════════════════════
    // Error Handling
    // ═══════════════════════════════════════════════════════
    console.error('[LiveKit Token] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate LiveKit token',
        message: error instanceof Error ? error.message : String(error)
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500 
      }
    );
  }
});