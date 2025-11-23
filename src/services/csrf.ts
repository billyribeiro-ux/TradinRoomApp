/**
 * CSRF Protection Service
 * Enterprise-grade CSRF token management
 */

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, Array.from(array)));
}

/**
 * Set CSRF token in cookie
 */
export function setCSRFCookie(token: string): void {
  const isProduction = import.meta.env.PROD;
  const cookieOptions = [
    `csrf_token=${token}`,
    'SameSite=Strict',
    'Path=/',
    `Max-Age=${60 * 60 * 24}`, // 24 hours
    isProduction ? 'Secure' : '', // Only use Secure in production
    'HttpOnly' // Prevent JS access
  ].filter(Boolean).join('; ');
  
  // Note: HttpOnly cookies must be set by server
  // This is a client-side fallback for development
  if (!isProduction) {
    document.cookie = cookieOptions.replace('HttpOnly', '');
  }
}

/**
 * Get CSRF token from cookie
 */
export function getCSRFToken(): string | null {
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string | null): boolean {
  if (!token) return false;
  const storedToken = getCSRFToken();
  if (!storedToken) return false;
  
  // Constant-time comparison to prevent timing attacks
  if (token.length !== storedToken.length) return false;
  
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ storedToken.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Add CSRF token to request headers
 */
export function addCSRFHeader(headers: HeadersInit = {}): HeadersInit {
  const token = getCSRFToken();
  if (!token) {
    // Generate new token if none exists
    const newToken = generateCSRFToken();
    setCSRFCookie(newToken);
    return {
      ...headers,
      'X-CSRF-Token': newToken
    };
  }
  
  return {
    ...headers,
    'X-CSRF-Token': token
  };
}

/**
 * Initialize CSRF protection
 */
export function initializeCSRF(): void {
  // Check if token exists, create if not
  if (!getCSRFToken()) {
    const token = generateCSRFToken();
    setCSRFCookie(token);
    console.log('[CSRF] Token initialized');
  }
}
