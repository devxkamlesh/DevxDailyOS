# Sadhana API Documentation (M006)

## Overview

This document describes the REST API endpoints available in the Sadhana habit tracking application.

**Base URL**: `https://your-domain.com/api`

**Authentication**: All endpoints (except `/health`) require authentication via Supabase Auth session cookies.

---

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Common Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | User not authenticated |
| `FORBIDDEN` | 403 | User lacks permission |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Endpoints

### Health Check

#### GET /api/health
Check system health status.

**Authentication**: Not required

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-15T10:30:00.000Z",
  "version": "1.0.0",
  "uptime": 3600000,
  "checks": {
    "database": { "status": "pass", "latency": 15 },
    "auth": { "status": "pass", "latency": 20 }
  }
}
```

**Status Values**:
- `healthy`: All systems operational
- `degraded`: Some systems experiencing issues
- `unhealthy`: Critical systems down

---

### Payments

#### POST /api/create-order
Create a Razorpay payment order.

**Request Body**:
```json
{
  "packageId": "uuid",
  "couponCode": "SAVE10"  // optional
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "orderId": "order_xyz123",
    "amount": 9900,
    "currency": "INR",
    "packageName": "100 Coins"
  }
}
```

---

#### POST /api/verify-payment
Verify and process a completed payment.

**Request Body**:
```json
{
  "razorpay_order_id": "order_xyz123",
  "razorpay_payment_id": "pay_abc456",
  "razorpay_signature": "signature_hash"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "coinsAdded": 100,
    "newBalance": 250
  }
}
```

---

### Shop

#### POST /api/shop/purchase
Purchase an item from the shop.

**Request Body**:
```json
{
  "itemId": "uuid",
  "itemType": "badge" | "theme" | "streak_shield"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "purchaseId": "uuid",
    "coinsSpent": 50,
    "newBalance": 200
  }
}
```

---

### Coupons

#### POST /api/coupons/validate
Validate a coupon code.

**Request Body**:
```json
{
  "code": "SAVE10",
  "packageId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "discountType": "percentage",
    "discountValue": 10,
    "finalAmount": 8910
  }
}
```

---

## Database Operations (via Supabase)

The following operations are performed directly via Supabase client, not REST API:

### Habits

#### Create Habit
```typescript
const { data, error } = await supabase
  .from('habits')
  .insert({
    name: 'Morning Exercise',
    category: 'health',
    frequency: 'daily',
    user_id: userId
  })
  .select()
  .single();
```

#### Get User Habits
```typescript
const { data, error } = await supabase
  .from('habits')
  .select('*')
  .eq('user_id', userId)
  .eq('is_active', true)
  .order('created_at', { ascending: false });
```

#### Update Habit
```typescript
const { data, error } = await supabase
  .from('habits')
  .update({ name: 'Evening Exercise' })
  .eq('id', habitId)
  .eq('user_id', userId)
  .select()
  .single();
```

#### Delete Habit (Soft Delete)
```typescript
const { error } = await supabase
  .from('habits')
  .update({ is_active: false })
  .eq('id', habitId)
  .eq('user_id', userId);
```

---

### Habit Logs

#### Log Habit Completion
```typescript
const { data, error } = await supabase
  .from('habit_logs')
  .upsert({
    habit_id: habitId,
    user_id: userId,
    completed_at: new Date().toISOString(),
    completed: true
  })
  .select()
  .single();
```

#### Get Logs for Date Range
```typescript
const { data, error } = await supabase
  .from('habit_logs')
  .select('*')
  .eq('user_id', userId)
  .gte('completed_at', startDate)
  .lte('completed_at', endDate);
```

---

### User Rewards

#### Get User Rewards (with version for optimistic locking)
```typescript
const { data, error } = await supabase
  .rpc('get_user_rewards_with_version', { p_user_id: userId });
```

#### Add Coins (Safe)
```typescript
const { data, error } = await supabase
  .rpc('add_coins_safe', {
    p_user_id: userId,
    p_coins: 10,
    p_reason: 'habit_completion',
    p_reference_id: habitLogId
  });
```

#### Spend Coins (Safe)
```typescript
const { data, error } = await supabase
  .rpc('spend_coins_safe', {
    p_user_id: userId,
    p_coins: 50,
    p_expected_version: currentVersion,
    p_reason: 'shop_purchase',
    p_reference_id: purchaseId
  });
```

---

### Analytics

#### Get User Habit Analytics
```typescript
const { data, error } = await supabase
  .rpc('get_user_habit_analytics', {
    p_user_id: userId,
    p_start_date: startDate,
    p_end_date: endDate
  });
```

**Response**:
```json
{
  "total_habits": 5,
  "total_completions": 120,
  "completion_rate": 0.85,
  "current_streak": 14,
  "longest_streak": 30,
  "perfect_days": 10,
  "by_category": {
    "health": { "count": 2, "completions": 50 },
    "productivity": { "count": 3, "completions": 70 }
  }
}
```

---

## Rate Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| General API | 60 requests | 1 minute |
| Payment | 10 requests | 1 minute |
| Habit Operations | 100 requests | 1 minute |

When rate limited, the API returns:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later."
  }
}
```

Headers included:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

---

## Webhooks

### Razorpay Payment Webhook
**Endpoint**: POST /api/razorpay/webhook

Handles payment events from Razorpay. Verifies webhook signature before processing.

**Events Handled**:
- `payment.captured`: Payment successful
- `payment.failed`: Payment failed
- `refund.created`: Refund initiated

---

## Error Handling

### Validation Errors
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "name", "message": "Name is required" },
      { "field": "category", "message": "Invalid category" }
    ]
  }
}
```

### Database Errors
```json
{
  "success": false,
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Failed to save data. Please try again."
  }
}
```

---

## Best Practices

1. **Always check `success` field** before accessing `data`
2. **Handle rate limits** with exponential backoff
3. **Use optimistic locking** for coin/XP operations
4. **Validate input client-side** before sending requests
5. **Cache responses** where appropriate (user profile, badges list)

---

## Changelog

### v1.0.0 (December 2025)
- Initial API release
- Health check endpoint
- Payment processing
- Shop purchases
- Coupon validation
