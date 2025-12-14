/**
 * H012: Rate Limit Tests
 * Unit tests for rate limiting
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  checkRateLimit,
  getRateLimitKey,
  RATE_LIMITS,
  checkSlidingWindowRateLimit,
} from './rate-limit';

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Reset time mocking
    vi.useRealTimers();
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      const config = { windowMs: 60000, maxRequests: 5 };
      const key = 'test-user-1';
      
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(key, config);
        expect(result.success).toBe(true);
        expect(result.remaining).toBe(4 - i);
      }
    });

    it('should block requests exceeding limit', () => {
      const config = { windowMs: 60000, maxRequests: 3 };
      const key = 'test-user-2';
      
      // Use up the limit
      for (let i = 0; i < 3; i++) {
        checkRateLimit(key, config);
      }
      
      // Next request should be blocked
      const result = checkRateLimit(key, config);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should reset after window expires', () => {
      vi.useFakeTimers();
      const config = { windowMs: 1000, maxRequests: 2 };
      const key = 'test-user-3';
      
      // Use up the limit
      checkRateLimit(key, config);
      checkRateLimit(key, config);
      
      // Should be blocked
      let result = checkRateLimit(key, config);
      expect(result.success).toBe(false);
      
      // Advance time past window
      vi.advanceTimersByTime(1100);
      
      // Should be allowed again
      result = checkRateLimit(key, config);
      expect(result.success).toBe(true);
    });
  });

  describe('getRateLimitKey', () => {
    it('should create key with userId', () => {
      const key = getRateLimitKey('user-123', '192.168.1.1', '/api/test');
      expect(key).toBe('/api/test:user-123');
    });

    it('should fallback to IP when no userId', () => {
      const key = getRateLimitKey(null, '192.168.1.1', '/api/test');
      expect(key).toBe('/api/test:192.168.1.1');
    });

    it('should use anonymous when no userId or IP', () => {
      const key = getRateLimitKey(null, null, '/api/test');
      expect(key).toBe('/api/test:anonymous');
    });
  });

  describe('RATE_LIMITS configurations', () => {
    it('should have stricter limits for auth', () => {
      expect(RATE_LIMITS.auth.maxRequests).toBeLessThan(RATE_LIMITS.api.maxRequests);
    });

    it('should have stricter limits for payments', () => {
      expect(RATE_LIMITS.payment.maxRequests).toBeLessThan(RATE_LIMITS.api.maxRequests);
    });

    it('should have generous limits for habits', () => {
      expect(RATE_LIMITS.habits.maxRequests).toBeGreaterThan(RATE_LIMITS.api.maxRequests);
    });
  });

  describe('checkSlidingWindowRateLimit', () => {
    it('should allow requests within limit', () => {
      const config = { windowMs: 60000, maxRequests: 5 };
      const key = 'sliding-test-1';
      
      for (let i = 0; i < 5; i++) {
        const result = checkSlidingWindowRateLimit(key, config);
        expect(result.success).toBe(true);
      }
    });

    it('should block requests exceeding limit', () => {
      const config = { windowMs: 60000, maxRequests: 3 };
      const key = 'sliding-test-2';
      
      // Use up the limit
      for (let i = 0; i < 3; i++) {
        checkSlidingWindowRateLimit(key, config);
      }
      
      // Next request should be blocked
      const result = checkSlidingWindowRateLimit(key, config);
      expect(result.success).toBe(false);
    });
  });
});
