/**
 * H012: Validation Tests
 * Unit tests for input validation
 */

import { describe, it, expect } from 'vitest';
import {
  validate,
  createHabitSchema,
  updateHabitSchema,
  habitLogSchema,
  purchaseSchema,
  paymentVerificationSchema,
  createBadgeSchema,
  updateProfileSchema,
  sanitizeHtml,
  trimAndNormalize,
} from './validation';

describe('Validation Library', () => {
  describe('createHabitSchema', () => {
    it('should validate a valid habit', () => {
      const result = validate(createHabitSchema, {
        name: 'Morning Meditation',
        description: 'Meditate for 10 minutes',
        category: 'morning',
        type: 'boolean',
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Morning Meditation');
      }
    });

    it('should reject empty name', () => {
      const result = validate(createHabitSchema, {
        name: '',
      });
      
      expect(result.success).toBe(false);
    });

    it('should reject invalid category', () => {
      const result = validate(createHabitSchema, {
        name: 'Test Habit',
        category: 'invalid',
      });
      
      expect(result.success).toBe(false);
    });

    it('should reject name that is too long', () => {
      const result = validate(createHabitSchema, {
        name: 'a'.repeat(101),
      });
      
      expect(result.success).toBe(false);
    });

    it('should apply default values', () => {
      const result = validate(createHabitSchema, {
        name: 'Test',
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('boolean');
        expect(result.data.is_active).toBe(true);
      }
    });
  });

  describe('habitLogSchema', () => {
    it('should validate a valid habit log', () => {
      const result = validate(habitLogSchema, {
        habit_id: '123e4567-e89b-12d3-a456-426614174000',
        date: '2025-12-15',
        completed: true,
      });
      
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const result = validate(habitLogSchema, {
        habit_id: 'not-a-uuid',
        date: '2025-12-15',
      });
      
      expect(result.success).toBe(false);
    });

    it('should reject invalid date format', () => {
      const result = validate(habitLogSchema, {
        habit_id: '123e4567-e89b-12d3-a456-426614174000',
        date: '15-12-2025',
      });
      
      expect(result.success).toBe(false);
    });

    it('should validate focus_score range', () => {
      const validResult = validate(habitLogSchema, {
        habit_id: '123e4567-e89b-12d3-a456-426614174000',
        date: '2025-12-15',
        focus_score: 5,
      });
      expect(validResult.success).toBe(true);

      const invalidResult = validate(habitLogSchema, {
        habit_id: '123e4567-e89b-12d3-a456-426614174000',
        date: '2025-12-15',
        focus_score: 11,
      });
      expect(invalidResult.success).toBe(false);
    });
  });

  describe('purchaseSchema', () => {
    it('should validate a valid purchase', () => {
      const result = validate(purchaseSchema, {
        planId: '123e4567-e89b-12d3-a456-426614174000',
      });
      
      expect(result.success).toBe(true);
    });

    it('should accept optional coupon code', () => {
      const result = validate(purchaseSchema, {
        planId: '123e4567-e89b-12d3-a456-426614174000',
        couponCode: 'SAVE20',
      });
      
      expect(result.success).toBe(true);
    });
  });

  describe('paymentVerificationSchema', () => {
    it('should validate payment verification data', () => {
      const result = validate(paymentVerificationSchema, {
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'sig_123',
        coins: 100,
      });
      
      expect(result.success).toBe(true);
    });

    it('should reject negative coins', () => {
      const result = validate(paymentVerificationSchema, {
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'sig_123',
        coins: -100,
      });
      
      expect(result.success).toBe(false);
    });

    it('should reject coins exceeding limit', () => {
      const result = validate(paymentVerificationSchema, {
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'sig_123',
        coins: 200000,
      });
      
      expect(result.success).toBe(false);
    });
  });

  describe('createBadgeSchema', () => {
    it('should validate a valid badge', () => {
      const result = validate(createBadgeSchema, {
        name: 'First Steps',
        description: 'Complete your first habit',
        rarity: 'common',
      });
      
      expect(result.success).toBe(true);
    });

    it('should reject invalid rarity', () => {
      const result = validate(createBadgeSchema, {
        name: 'Test Badge',
        rarity: 'super-rare',
      });
      
      expect(result.success).toBe(false);
    });
  });

  describe('updateProfileSchema', () => {
    it('should validate profile update', () => {
      const result = validate(updateProfileSchema, {
        username: 'john_doe',
        full_name: 'John Doe',
        bio: 'Hello world',
      });
      
      expect(result.success).toBe(true);
    });

    it('should reject invalid username characters', () => {
      const result = validate(updateProfileSchema, {
        username: 'john doe!',
      });
      
      expect(result.success).toBe(false);
    });

    it('should reject username too short', () => {
      const result = validate(updateProfileSchema, {
        username: 'ab',
      });
      
      expect(result.success).toBe(false);
    });

    it('should validate website URL', () => {
      const validResult = validate(updateProfileSchema, {
        website: 'https://example.com',
      });
      expect(validResult.success).toBe(true);

      const invalidResult = validate(updateProfileSchema, {
        website: 'not-a-url',
      });
      expect(invalidResult.success).toBe(false);
    });

    it('should allow empty website', () => {
      const result = validate(updateProfileSchema, {
        website: '',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Sanitization Helpers', () => {
    it('should sanitize HTML', () => {
      const input = '<script>alert("xss")</script>';
      const sanitized = sanitizeHtml(input);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('&lt;script&gt;');
    });

    it('should trim and normalize whitespace', () => {
      const input = '  hello   world  ';
      const normalized = trimAndNormalize(input);
      
      expect(normalized).toBe('hello world');
    });
  });
});
