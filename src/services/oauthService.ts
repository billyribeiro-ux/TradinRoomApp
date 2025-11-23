// Fixed: 2025-10-24 - Emergency null/undefined fixes for production
// Microsoft TypeScript standards applied - null → undefined, using optional types


// Fixed: 2025-01-24 - Eradicated 4 null usage(s) - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types

// src/services/oauthService.ts
export interface OAuthConfig {
  authUrl: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  provider: 'spotify' | 'x' | 'linkedin';
}

class OAuthService {
  private popupWindow: Window | undefined  = undefined;
  private popupInterval: number | undefined  = undefined;

  /**
   * Popup-based OAuth flow
   * Opens OAuth provider in a popup window and polls for callback
   */
  async authenticate(
    config: OAuthConfig,
    onSuccess: (code: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      console.log('🔐 [OAuthService] Starting OAuth authentication (popup method)');
      console.log('🔐 [OAuthService] Provider:', config.provider);
      console.log('🔐 [OAuthService] Auth URL:', config.authUrl);
      console.log('🔐 [OAuthService] Redirect URI:', config.redirectUri);

      // Build OAuth URL with parameters
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        scope: config.scope,
        response_type: 'code',
        state: config.provider,
        ...(config.provider === 'x' && {
          code_challenge: 'challenge',
          code_challenge_method: 'plain'
        }),
      });

      const authUrl = `${config.authUrl}?${params.toString()}`;

      console.log('🔐 [OAuthService] Full Auth URL:', authUrl);

      // Validate the URL
      if (!authUrl.startsWith('https://')) {
        throw new Error('Invalid authorization URL: must use HTTPS');
      }

      // Open popup window - centered and properly sized
      const width = 500;
      const height = 600;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;

      const popup = window.open(
        authUrl,
        'oauth_popup',
        `popup=yes,width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,copyhistory=no`
      );

      // Focus the popup
      if (popup) {
        popup.focus();
      }

      if (!popup) {
        throw new Error('Popup was blocked. Please allow popups for this site.');
      }

      console.log('✅ [OAuthService] Popup opened successfully');

      this.popupWindow = popup;

      // Poll for popup closure or OAuth code
      this.popupInterval = window.setInterval(() => {
        try {
          if (popup.closed) {
            this.cleanup();
            console.log('⚠️ [OAuthService] Popup closed by user');
            onError('Authorization cancelled');
            return;
          }

          // Try to read popup URL (will fail due to CORS until redirect happens)
          try {
            const popupUrl = popup.location.href;

            if (popupUrl.includes(config.redirectUri)) {
              this.cleanup();

              const url = new URL(popupUrl);
              const code = url.searchParams.get('code');
              const error = url.searchParams.get('error');

              popup.close();

              if (error) {
                console.error('❌ [OAuthService] OAuth error:', error);
                onError(error);
              } else if (code) {
                console.log('✅ [OAuthService] OAuth code received');
                onSuccess(code);
              } else {
                console.error('❌ [OAuthService] No code or error in callback');
                onError('No authorization code received');
              }
            }
          } catch (e) {
            // CORS error - expected while on OAuth provider's domain
            // Will succeed once redirected back to our domain
          }
        } catch (err) {
          // Suppress noisy polling errors (network/CORS) but keep a lightweight dev hint
          if (import.meta.env.DEV) {
            console.warn('⚠️ [OAuthService] Polling transient error (ignored)', err);
          }
        }
      }, 500);

      // Timeout after 5 minutes
      setTimeout(() => {
        if (this.popupWindow && !this.popupWindow.closed) {
          this.cleanup();
          popup.close();
          onError('Authorization timeout');
        }
      }, 300000);

    } catch (authErr) {
      this.cleanup();
      console.error('❌ [OAuthService] OAuth authentication failed:', authErr);
      onError(authErr instanceof Error ? authErr.message : 'Authentication failed');
    }
  }

  /**
   * Cleanup function to close popup and clear interval
   */
  private cleanup() {
    if (this.popupWindow) {
      try {
        this.popupWindow.close();
      } catch (e) {
        console.warn('🪟 [OAuthService] Could not close popup:', e);
      }
      this.popupWindow  = undefined;
    }
    if (this.popupInterval) {
      clearInterval(this.popupInterval);
      this.popupInterval  = undefined;
    }
  }
}

export const oauthService = new OAuthService();