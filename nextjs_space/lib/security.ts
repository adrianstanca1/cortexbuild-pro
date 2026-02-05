/**
 * Security Headers and Middleware
 * 
 * Implements security best practices including CSP, HSTS, and other headers
 */

/**
 * Security headers configuration
 */
export const securityHeaders = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Enable XSS protection (legacy browsers)
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy (formerly Feature Policy)
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  
  // HSTS (HTTP Strict Transport Security) - only in production with HTTPS
  ...(process.env.NODE_ENV === 'production' ? {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  } : {}),
};

/**
 * Content Security Policy
 * Adjust based on your application's needs
 */
export function getContentSecurityPolicy(): string {
  const policies = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://*.abacusai.app https://*.amazonaws.com wss://* ws://localhost:*",
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];
  
  // In development, be more lenient
  if (process.env.NODE_ENV === 'development') {
    return policies.join('; ').replace('upgrade-insecure-requests', '');
  }
  
  return policies.join('; ');
}

/**
 * CORS configuration
 */
export interface CorsOptions {
  origin: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

export const corsConfig: CorsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-CSRF-Token',
    'X-Requested-With',
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
};

/**
 * Apply CORS headers to response
 */
export function applyCorsHeaders(response: Response, origin?: string): Response {
  const headers = new Headers(response.headers);

  // Handle origin
  if (corsConfig.origin === '*' || corsConfig.origin === true) {
    // When credentials are enabled, we cannot use a wildcard origin.
    // Reflect the request origin (if provided) and vary by Origin.
    if (corsConfig.credentials && origin) {
      headers.set('Access-Control-Allow-Origin', origin);
      const existingVary = headers.get('Vary');
      if (existingVary) {
        const varyValues = existingVary.split(',').map(v => v.trim().toLowerCase());
        if (!varyValues.includes('origin')) {
          headers.set('Vary', existingVary + ', Origin');
        }
      } else {
        headers.set('Vary', 'Origin');
      }
    } else if (!corsConfig.credentials) {
      headers.set('Access-Control-Allow-Origin', '*');
    }
  } else if (typeof corsConfig.origin === 'string') {
    headers.set('Access-Control-Allow-Origin', corsConfig.origin);
  } else if (Array.isArray(corsConfig.origin) && origin) {
    if (corsConfig.origin.includes(origin)) {
      headers.set('Access-Control-Allow-Origin', origin);
      // Response may differ per allowed origin, so vary by Origin.
      const existingVary = headers.get('Vary');
      if (existingVary) {
        const varyValues = existingVary.split(',').map(v => v.trim().toLowerCase());
        if (!varyValues.includes('origin')) {
          headers.set('Vary', existingVary + ', Origin');
        }
      } else {
        headers.set('Vary', 'Origin');
      }
    }
  }
  
  // Apply other CORS headers
  if (corsConfig.methods) {
    headers.set('Access-Control-Allow-Methods', corsConfig.methods.join(', '));
  }
  
  if (corsConfig.allowedHeaders) {
    headers.set('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
  }
  
  if (corsConfig.exposedHeaders) {
    headers.set('Access-Control-Expose-Headers', corsConfig.exposedHeaders.join(', '));
  }
  
  if (corsConfig.credentials) {
    headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  if (corsConfig.maxAge) {
    headers.set('Access-Control-Max-Age', corsConfig.maxAge.toString());
  }
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  
  // Apply all security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
  
  // Apply CSP
  headers.set('Content-Security-Policy', getContentSecurityPolicy());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Request size limit (bytes)
 */
export const REQUEST_SIZE_LIMITS = {
  default: 1024 * 1024,      // 1MB for regular requests
  upload: 100 * 1024 * 1024, // 100MB for file uploads
  json: 10 * 1024 * 1024,    // 10MB for JSON payloads
};

/**
 * Check request size limit
 */
export async function checkRequestSize(
  request: Request,
  limit: number = REQUEST_SIZE_LIMITS.default
): Promise<{ ok: true } | { ok: false; response: Response }> {
  const contentLength = request.headers.get('content-length');
  
  if (contentLength && parseInt(contentLength) > limit) {
    const response = new Response(
      JSON.stringify({
        error: 'Payload too large',
        message: `Request body exceeds maximum size of ${Math.floor(limit / 1024 / 1024)}MB`,
      }),
      {
        status: 413,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    return { ok: false, response };
  }
  
  return { ok: true };
}

/**
 * Sanitize input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate file upload
 */
export interface FileValidationOptions {
  maxSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export function validateFileUpload(
  fileName: string,
  fileSize: number,
  mimeType: string,
  options: FileValidationOptions = {}
): { valid: true } | { valid: false; error: string } {
  const {
    maxSize = 100 * 1024 * 1024, // 100MB default
    allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ],
    allowedExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.webp',
      '.pdf', '.doc', '.docx', '.xls', '.xlsx',
      '.txt', '.csv',
    ],
  } = options;
  
  // Check file size
  if (fileSize > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${Math.floor(maxSize / 1024 / 1024)}MB`,
    };
  }
  
  // Check MIME type
  if (!allowedTypes.includes(mimeType)) {
    return {
      valid: false,
      error: 'File type not allowed',
    };
  }
  
  // Check file extension
  const extension = fileName.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!extension || !allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: 'File extension not allowed',
    };
  }
  
  return { valid: true };
}
