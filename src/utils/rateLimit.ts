/** Shared utility — SSOT. Do not duplicate logic elsewhere. */

interface RateLimiter {
  /**
   * Attempts to execute an action within rate limits.
   * @returns true if allowed, false if rate limit exceeded
   */
  attempt(): boolean;
  /**
   * Resets the rate limiter state.
   */
  reset(): void;
}

/**
 * Creates a simple front-end rate limiter.
 * Tracks action attempts within a sliding window.
 * 
 * @param windowMs - Time window in milliseconds
 * @param maxAttempts - Maximum attempts allowed within window
 * @returns Rate limiter instance
 * 
 * @example
 * const limiter = createRateLimiter(5000, 3); // 3 attempts per 5 seconds
 * if (!limiter.attempt()) {
 *   alert('Please slow down');
 *   return;
 * }
 */
export function createRateLimiter(windowMs: number, maxAttempts: number): RateLimiter {
  const attempts: number[] = [];

  return {
    attempt(): boolean {
      const now = Date.now();
      
      // Remove attempts outside the window
      while (attempts.length > 0 && attempts[0] < now - windowMs) {
        attempts.shift();
      }

      // Check if limit exceeded
      if (attempts.length >= maxAttempts) {
        return false;
      }

      // Record this attempt
      attempts.push(now);
      return true;
    },

    reset(): void {
      attempts.length = 0;
    },
  };
}
