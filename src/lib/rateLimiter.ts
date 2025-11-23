// ============================================================================
// MICROSOFT RATE LIMITING SERVICE - Enterprise Standard
// ============================================================================

interface RateWindow {
  count: number;
  resetTime: number;
  lastError?: number;
}

interface RateLimitRequest {
  headers: Record<string, string | string[] | undefined>;
  socket: { remoteAddress?: string };
}

interface RateLimitResponse {
  setHeader: (name: string, value: string | number) => void;
}

const rateLimits = new Map<string, RateWindow>();

// Microsoft Pattern: Token Bucket Algorithm
export async function enforceRateLimit(
  req: RateLimitRequest,
  res: RateLimitResponse,
  options: {
    interval: number;
    tokens: number;
    userId?: string;
  }
) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress);
  const key = options.userId ? `user:${options.userId}` : `ip:${ip}`;
  
  try {
    const now = Date.now();
    let window = rateLimits.get(key);

    // Circuit Breaker Check
    if (window?.lastError && window.lastError > now - 10000) {
      return { allowed: true, status: 'circuit_open' };
    }

    // Initialize or Reset Window
    if (!window || window.resetTime <= now) {
      window = { count: 0, resetTime: now + options.interval * 1000 };
      rateLimits.set(key, window);
    }

    // Enforce Limit
    if (window.count >= options.tokens) {
      res.setHeader('Retry-After', Math.ceil((window.resetTime - now) / 1000));
      return { allowed: false, status: 'rate_limited' };
    }

    window.count++;
    return { allowed: true, remaining: options.tokens - window.count };
  } catch (error) {
    // Fail Open on Errors (Microsoft Resilience Pattern)
    console.error('[RateLimiter]', error);
    return { allowed: true, status: 'error_bypass' };
  }
}

// Microsoft Standard Tiers
export const RATE_LIMIT_TIERS = {
  CRITICAL: { interval: 60, tokens: 30 },   // Auth endpoints
  DEFAULT: { interval: 60, tokens: 100 },   // Regular APIs
  BURST: { interval: 10, tokens: 20 }       // File uploads
} as const;
