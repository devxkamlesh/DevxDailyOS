/**
 * H002: CSRF Protection Library
 * Prevents Cross-Site Request Forgery attacks
 */

import { cookies } from 'next/headers';
import crypto from 'crypto';

const CSRF_TOKEN_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32;
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CSRFToken {
  token: string;
  expires: number;
}

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

/**
 * Create and store a new CSRF token in cookies
 */
export async function createCSRFToken(): Promise<string> {
  const token = generateCSRFToken();
  const expires = Date.now() + TOKEN_EXPIRY_MS;
  
  const cookieStore = await cookies();
  cookieStore.set(CSRF_TOKEN_NAME, JSON.stringify({ token, expires }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: TOKEN_EXPIRY_MS / 1000,
  });
  
  return token;
}

/**
 * Validate CSRF token from request
 */
export async function validateCSRFToken(requestToken: string | null): Promise<boolean> {
  if (!requestToken) {
    return false;
  }
  
  try {
    const cookieStore = await cookies();
    const storedValue = cookieStore.get(CSRF_TOKEN_NAME)?.value;
    
    if (!storedValue) {
      return false;
    }
    
    const stored: CSRFToken = JSON.parse(storedValue);
    
    // Check expiry
    if (Date.now() > stored.expires) {
      return false;
    }
    
    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(requestToken),
      Buffer.from(stored.token)
    );
  } catch {
    return false;
  }
}

/**
 * Get CSRF token from request headers
 */
export function getCSRFTokenFromHeaders(headers: Headers): string | null {
  return headers.get(CSRF_HEADER_NAME);
}

/**
 * Middleware helper to validate CSRF for state-changing requests
 */
export async function requireCSRF(request: Request): Promise<{ valid: boolean; error?: string }> {
  const method = request.method.toUpperCase();
  
  // Only validate for state-changing methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return { valid: true };
  }
  
  const token = getCSRFTokenFromHeaders(request.headers);
  
  if (!token) {
    return { valid: false, error: 'CSRF token missing' };
  }
  
  const isValid = await validateCSRFToken(token);
  
  if (!isValid) {
    return { valid: false, error: 'Invalid or expired CSRF token' };
  }
  
  return { valid: true };
}

/**
 * Create CSRF error response
 */
export function createCSRFErrorResponse(error: string): Response {
  return new Response(
    JSON.stringify({ error, code: 'CSRF_VALIDATION_FAILED' }),
    {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * React hook helper - returns token for client-side use
 * Note: This should be called from a server component and passed to client
 */
export async function getCSRFTokenForClient(): Promise<string> {
  const cookieStore = await cookies();
  const storedValue = cookieStore.get(CSRF_TOKEN_NAME)?.value;
  
  if (storedValue) {
    try {
      const stored: CSRFToken = JSON.parse(storedValue);
      if (Date.now() < stored.expires) {
        return stored.token;
      }
    } catch {
      // Token invalid, create new one
    }
  }
  
  return createCSRFToken();
}
