/**
 * H005, H011: API Utilities
 * Standardized API responses, error handling, and middleware
 */

import { NextResponse } from 'next/server';
import { ZodSchema } from 'zod';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS, createRateLimitResponse } from './rate-limit';
import { validate } from './validation';

// ============================================
// STANDARDIZED API RESPONSE FORMAT (M005)
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

export function errorResponse(
  code: string,
  message: string,
  status = 400,
  details?: unknown
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details: process.env.NODE_ENV === 'development' ? details : undefined,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

// ============================================
// ERROR CODES
// ============================================

export const ErrorCodes = {
  // Authentication
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',
  
  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // Rate limiting
  RATE_LIMITED: 'RATE_LIMITED',
  
  // Business logic
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  LIMIT_EXCEEDED: 'LIMIT_EXCEEDED',
  EXPIRED: 'EXPIRED',
  
  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

// ============================================
// REQUEST VALIDATION MIDDLEWARE
// ============================================

export async function validateRequest<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const body = await request.json();
    const result = validate(schema, body);
    
    if (!result.success) {
      return {
        success: false,
        response: errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid request data',
          400,
          result.errors
        ),
      };
    }
    
    return { success: true, data: result.data };
  } catch (e) {
    return {
      success: false,
      response: errorResponse(
        ErrorCodes.INVALID_INPUT,
        'Invalid JSON body',
        400
      ),
    };
  }
}

// ============================================
// RATE LIMITING MIDDLEWARE
// ============================================

export function withRateLimit(
  userId: string | null,
  ip: string | null,
  endpoint: string,
  limitType: keyof typeof RATE_LIMITS = 'api'
): { success: true } | { success: false; response: Response } {
  const key = getRateLimitKey(userId, ip, endpoint);
  const config = RATE_LIMITS[limitType];
  const result = checkRateLimit(key, config);
  
  if (!result.success) {
    return {
      success: false,
      response: createRateLimitResponse(result),
    };
  }
  
  return { success: true };
}

// ============================================
// ERROR HANDLING WRAPPER
// ============================================

type ApiHandler = (request: Request) => Promise<NextResponse>;

export function withErrorHandling(handler: ApiHandler): ApiHandler {
  return async (request: Request) => {
    try {
      return await handler(request);
    } catch (error) {
      console.error('API Error:', error);
      
      // Handle known error types
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return errorResponse(ErrorCodes.NOT_FOUND, error.message, 404);
        }
        if (error.message.includes('unauthorized') || error.message.includes('Unauthorized')) {
          return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required', 401);
        }
        if (error.message.includes('forbidden') || error.message.includes('Forbidden')) {
          return errorResponse(ErrorCodes.FORBIDDEN, 'Access denied', 403);
        }
      }
      
      // Generic error
      return errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'An unexpected error occurred',
        500,
        process.env.NODE_ENV === 'development' ? error : undefined
      );
    }
  };
}

// ============================================
// LOGGING UTILITIES (M007)
// ============================================

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
}

export function log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    error,
  };
  
  // In production, send to logging service
  // For now, structured console logging
  const logFn = level === LogLevel.ERROR ? console.error : 
                level === LogLevel.WARN ? console.warn : 
                console.log;
  
  logFn(JSON.stringify(entry, null, process.env.NODE_ENV === 'development' ? 2 : 0));
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => log(LogLevel.DEBUG, message, context),
  info: (message: string, context?: Record<string, unknown>) => log(LogLevel.INFO, message, context),
  warn: (message: string, context?: Record<string, unknown>) => log(LogLevel.WARN, message, context),
  error: (message: string, context?: Record<string, unknown>, error?: Error) => log(LogLevel.ERROR, message, context, error),
};

// ============================================
// REQUEST CONTEXT
// ============================================

export function getRequestContext(request: Request): {
  ip: string | null;
  userAgent: string | null;
  origin: string | null;
} {
  return {
    ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 
        request.headers.get('x-real-ip') || 
        null,
    userAgent: request.headers.get('user-agent'),
    origin: request.headers.get('origin'),
  };
}
