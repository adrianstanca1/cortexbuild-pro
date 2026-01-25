/**
 * CSRF Protection Implementation
 * 
 * Implements Double Submit Cookie pattern for CSRF protection
 * Tokens are generated per session and validated on state-changing requests
 */

import { randomBytes, createHmac } from 'crypto';
import { cookies } from 'next/headers';

const CSRF_SECRET = (() => {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('CSRF secret is not configured. Set NEXTAUTH_SECRET to a strong, random value.');
  }
  return secret;
})();
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32;

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  const randomToken = randomBytes(TOKEN_LENGTH).toString('hex');
  
  // Create HMAC of the token using secret for additional security
  const hmac = createHmac('sha256', CSRF_SECRET);
  hmac.update(randomToken);
  const signature = hmac.digest('hex');
  
  return `${randomToken}.${signature}`;
}

/**
 * Validate a CSRF token
 */
export function validateCsrfToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  const parts = token.split('.');
  if (parts.length !== 2) {
    return false;
  }
  
  const [randomToken, providedSignature] = parts;
  
  // Recreate signature and compare
  const hmac = createHmac('sha256', CSRF_SECRET);
  hmac.update(randomToken);
  const expectedSignature = hmac.digest('hex');
  
  // Use timing-safe comparison
  return timingSafeEqual(providedSignature, expectedSignature);
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Set CSRF token in cookie
 */
export async function setCsrfToken(): Promise<string> {
  const token = generateCsrfToken();
  const cookieStore = await cookies();
  
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });
  
  return token;
}

/**
 * Get CSRF token from cookie
 */
export async function getCsrfToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE_NAME)?.value;
}

/**
 * Verify CSRF token from request
 * Checks both header and cookie
 */
export async function verifyCsrfToken(request: Request): Promise<boolean> {
  // Get token from header
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  
  if (!headerToken) {
    return false;
  }
  
  // Get token from cookie
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  
  if (!cookieToken) {
    return false;
  }
  
  // Both tokens must match and be valid
  return headerToken === cookieToken && validateCsrfToken(headerToken);
}

/**
 * Middleware to check CSRF token on state-changing methods
 */
export async function checkCsrf(request: Request): Promise<{ ok: true } | { ok: false; response: Response }> {
  const method = request.method.toUpperCase();
  
  // Only check CSRF on state-changing methods
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const isValid = await verifyCsrfToken(request);
    
    if (!isValid) {
      const response = new Response(
        JSON.stringify({
          error: 'Invalid CSRF token',
          message: 'CSRF validation failed. Please refresh the page and try again.',
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      return { ok: false, response };
    }
  }
  
  return { ok: true };
}

/**
 * Get CSRF token for client-side use
 * This can be called from an API route to provide token to frontend
 */
export async function getCsrfTokenForClient(): Promise<string> {
  let token = await getCsrfToken();
  
  if (!token) {
    token = await setCsrfToken();
  }
  
  return token;
}
