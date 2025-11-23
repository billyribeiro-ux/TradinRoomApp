import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRateLimiter } from '../../src/utils/rateLimit';

describe('rateLimit', () => {
  describe('createRateLimiter', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should allow attempts within limit', () => {
      const limiter = createRateLimiter(5000, 3);

      expect(limiter.attempt()).toBe(true);
      expect(limiter.attempt()).toBe(true);
      expect(limiter.attempt()).toBe(true);
    });

    it('should block attempts exceeding limit', () => {
      const limiter = createRateLimiter(5000, 3);

      limiter.attempt();
      limiter.attempt();
      limiter.attempt();

      expect(limiter.attempt()).toBe(false);
    });

    it('should allow attempts after window expires', () => {
      const limiter = createRateLimiter(5000, 3);

      limiter.attempt();
      limiter.attempt();
      limiter.attempt();

      expect(limiter.attempt()).toBe(false);

      // Advance time past window
      vi.advanceTimersByTime(5001);

      expect(limiter.attempt()).toBe(true);
    });

    it('should use sliding window', () => {
      const limiter = createRateLimiter(5000, 2);

      limiter.attempt(); // t=0
      vi.advanceTimersByTime(2000);
      limiter.attempt(); // t=2000

      expect(limiter.attempt()).toBe(false); // Still 2 in window

      vi.advanceTimersByTime(3001); // t=5001, first attempt expired

      expect(limiter.attempt()).toBe(true); // Only 1 in window now
    });

    it('should reset all attempts', () => {
      const limiter = createRateLimiter(5000, 2);

      limiter.attempt();
      limiter.attempt();

      expect(limiter.attempt()).toBe(false);

      limiter.reset();

      expect(limiter.attempt()).toBe(true);
      expect(limiter.attempt()).toBe(true);
    });

    it('should handle zero max attempts', () => {
      const limiter = createRateLimiter(5000, 0);

      expect(limiter.attempt()).toBe(false);
    });

    it('should handle single attempt limit', () => {
      const limiter = createRateLimiter(5000, 1);

      expect(limiter.attempt()).toBe(true);
      expect(limiter.attempt()).toBe(false);
    });

    it('should handle rapid successive attempts', () => {
      const limiter = createRateLimiter(1000, 5);

      for (let i = 0; i < 5; i++) {
        expect(limiter.attempt()).toBe(true);
      }

      expect(limiter.attempt()).toBe(false);
    });

    it('should track attempts independently per instance', () => {
      const limiter1 = createRateLimiter(5000, 2);
      const limiter2 = createRateLimiter(5000, 2);

      limiter1.attempt();
      limiter1.attempt();

      expect(limiter1.attempt()).toBe(false);
      expect(limiter2.attempt()).toBe(true); // Different instance
    });
  });
});
