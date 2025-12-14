/**
 * H001: Input Validation Library
 * Comprehensive server-side validation for all user inputs
 */

import { z } from 'zod';

// ============================================
// COMMON VALIDATORS
// ============================================

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const emailSchema = z.string().email('Invalid email format').max(255);

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// ============================================
// HABIT VALIDATORS
// ============================================

export const habitCategorySchema = z.enum(['morning', 'work', 'night', 'health', 'focus']);

export const habitTypeSchema = z.enum(['boolean', 'numeric']);

export const createHabitSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  emoji: z.string().max(10).optional(),
  category: habitCategorySchema.optional(),
  type: habitTypeSchema.default('boolean'),
  target_value: z.number().int().positive().max(10000).optional(),
  target_unit: z.string().max(50).optional(),
  is_active: z.boolean().default(true),
});

export const updateHabitSchema = createHabitSchema.partial();

export const habitLogSchema = z.object({
  habit_id: uuidSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  completed: z.boolean().default(false),
  value: z.number().int().min(0).max(100000).optional(),
  notes: z.string().max(1000).optional(),
  duration_minutes: z.number().int().min(0).max(1440).optional(),
  focus_score: z.number().int().min(1).max(10).optional(),
  interruptions: z.number().int().min(0).max(100).optional(),
});

// ============================================
// SHOP VALIDATORS
// ============================================

export const purchaseSchema = z.object({
  planId: uuidSchema,
  couponCode: z.string().max(50).optional(),
});

export const paymentVerificationSchema = z.object({
  razorpay_order_id: z.string().min(1).max(100),
  razorpay_payment_id: z.string().min(1).max(100),
  razorpay_signature: z.string().min(1).max(200),
  coins: z.number().int().positive().max(100000),
});

// ============================================
// ADMIN VALIDATORS
// ============================================

export const createBadgeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  rarity: z.enum(['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']).default('common'),
  category: z.string().max(50).optional(),
  requirement_type: z.string().max(50).optional(),
  requirement_value: z.number().int().min(0).optional(),
  xp_reward: z.number().int().min(0).max(10000).default(0),
  coin_reward: z.number().int().min(0).max(10000).default(0),
  is_purchasable: z.boolean().default(false),
  coin_price: z.number().int().min(0).max(100000).default(0),
});

export const createChallengeSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  target_type: z.enum(['completions', 'streak', 'perfect_days']),
  target_value: z.number().int().positive().max(1000),
  coin_reward: z.number().int().min(0).max(10000).default(0),
  xp_reward: z.number().int().min(0).max(10000).default(0),
  is_active: z.boolean().default(true),
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  week_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const createCouponSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase(),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.number().int().positive().max(100),
  min_purchase: z.number().int().min(0).default(0),
  max_uses: z.number().int().min(0).default(0),
  expires_at: z.string().datetime().optional(),
  is_active: z.boolean().default(true),
});

// ============================================
// PROFILE VALIDATORS
// ============================================

export const updateProfileSchema = z.object({
  username: usernameSchema.optional(),
  full_name: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  website: z.string().url().max(200).optional().or(z.literal('')),
  profile_icon: z.string().max(50).optional(),
  is_public: z.boolean().optional(),
  show_on_leaderboard: z.boolean().optional(),
  timezone: z.string().max(50).optional(),
});

// ============================================
// JOURNAL VALIDATORS
// ============================================

export const journalEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mood: z.number().int().min(1).max(5).optional(),
  energy: z.number().int().min(1).max(5).optional(),
  gratitude: z.string().max(1000).optional(),
  reflection: z.string().max(5000).optional(),
  goals: z.string().max(1000).optional(),
});

// ============================================
// VALIDATION HELPER FUNCTIONS
// ============================================

export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; errors: string[] };

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.errors.map(err => 
    `${err.path.join('.')}: ${err.message}`
  );
  
  return { success: false, errors };
}

export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

// ============================================
// SANITIZATION HELPERS
// ============================================

export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function sanitizeForSql(input: string): string {
  // Note: Always use parameterized queries, this is just an extra layer
  return input.replace(/['";\\]/g, '');
}

export function trimAndNormalize(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}
