import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z, ZodSchema } from 'zod';

// Helper to safely serialize data with BigInt values
export function serializeData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (_, value) =>
    typeof value === "bigint" ? Number(value) : value
  ));
}

export interface ApiContext {
  userId: string;
  organizationId: string;
  userRole: string;
  userName: string;
  userEmail: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Standard API error responses
export const ApiErrors = {
  UNAUTHORIZED: { status: 401, message: 'Unauthorized access' },
  FORBIDDEN: { status: 403, message: 'Insufficient permissions' },
  NOT_FOUND: { status: 404, message: 'Resource not found' },
  BAD_REQUEST: { status: 400, message: 'Invalid request data' },
  CONFLICT: { status: 409, message: 'Resource conflict' },
  INTERNAL_ERROR: { status: 500, message: 'Internal server error' },
};

// Create standardized error response
export function errorResponse(
  error: keyof typeof ApiErrors | string,
  details?: string
): NextResponse<ApiResponse> {
  const errorInfo = typeof error === 'string' && error in ApiErrors
    ? ApiErrors[error as keyof typeof ApiErrors]
    : { status: 400, message: error };
  
  return NextResponse.json(
    {
      success: false,
      error: errorInfo.message,
      message: details || errorInfo.message,
    },
    { status: errorInfo.status }
  );
}

// Create standardized success response
export function successResponse<T>(
  data: T,
  message?: string,
  pagination?: ApiResponse['pagination']
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message,
    pagination,
  });
}

// Validate request body against Zod schema
export async function validateBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T | null; error: NextResponse | null }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    
    if (!result.success) {
      const errorMessages = result.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      return {
        data: null,
        error: errorResponse('BAD_REQUEST', errorMessages),
      };
    }
    
    return { data: result.data, error: null };
  } catch {
    return {
      data: null,
      error: errorResponse('BAD_REQUEST', 'Invalid JSON body'),
    };
  }
}

// Get authenticated user context
export async function getApiContext(): Promise<{
  context: ApiContext | null;
  error: NextResponse | null;
}> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return { context: null, error: errorResponse('UNAUTHORIZED') };
  }
  
  const user = session.user as {
    id: string;
    organizationId?: string;
    role?: string;
    name?: string;
    email?: string;
  };
  
  if (!user.organizationId) {
    return {
      context: null,
      error: errorResponse('FORBIDDEN', 'No organization assigned'),
    };
  }
  
  return {
    context: {
      userId: user.id,
      organizationId: user.organizationId,
      userRole: user.role || 'FIELD_WORKER',
      userName: user.name || 'Unknown',
      userEmail: user.email || '',
    },
    error: null,
  };
}

// Check if user has required role
export function hasRole(
  userRole: string,
  requiredRoles: string[]
): boolean {
  const roleHierarchy: Record<string, number> = {
    SUPER_ADMIN: 5,
    COMPANY_OWNER: 4,
    ADMIN: 3,
    PROJECT_MANAGER: 2,
    FIELD_WORKER: 1,
  };
  
  const userLevel = roleHierarchy[userRole] || 0;
  const minRequired = Math.min(
    ...requiredRoles.map((r) => roleHierarchy[r] || 0)
  );
  
  return userLevel >= minRequired;
}

// Parse pagination parameters from URL
export function getPagination(request: NextRequest): {
  page: number;
  limit: number;
  skip: number;
} {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  
  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

// Parse date range from URL
export function getDateRange(request: NextRequest): {
  startDate?: Date;
  endDate?: Date;
} {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('startDate');
  const end = searchParams.get('endDate');
  
  return {
    startDate: start ? new Date(start) : undefined,
    endDate: end ? new Date(end) : undefined,
  };
}

// Wrap async handler with error catching
export function withErrorHandler<T>(
  handler: (request: NextRequest, context?: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: T): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      // Log to proper logging service in production
      if (process.env.NODE_ENV === 'development') {
        console.error('API Error:', error);
      }
      return errorResponse(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };
}

// Log API activity
export async function logActivity(
  prisma: { activityLog: { create: (args: { data: Record<string, unknown> }) => Promise<unknown> } },
  context: ApiContext,
  action: string,
  entityType: string,
  details: string,
  entityId?: string,
  entityName?: string,
  projectId?: string
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        action,
        entityType,
        entityId: entityId || null,
        entityName: entityName || null,
        details,
        userId: context.userId,
        projectId: projectId || null,
      },
    });
  } catch (error) {
    // Silently fail activity logging to prevent disrupting the main operation
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to log activity:', error);
    }
  }
}

// Input sanitization helper
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

// Sanitize common entity fields
export function sanitizeEntityFields<T extends Record<string, unknown>>(
  fields: T
): T {
  const sanitized = { ...fields };
  
  // Common string fields to sanitize
  // Note: Empty strings (after trim) are intentionally converted to null
  const stringFields = ['name', 'title', 'description', 'location', 'clientName', 'clientEmail'];
  
  for (const key of stringFields) {
    if (key in sanitized && typeof sanitized[key] === 'string') {
      const trimmed = (sanitized[key] as string).trim();
      sanitized[key] = (trimmed || null) as T[Extract<keyof T, string>];
    }
  }
  
  return sanitized;
}

// Broadcast entity event helper
export function broadcastEntityEvent(
  broadcast: (orgId: string, data: unknown) => void,
  organizationId: string | undefined,
  eventType: string,
  entity: {
    id: string;
    name?: string;
    title?: string;
    status?: string;
    [key: string]: unknown;
  },
  userId: string,
  additionalData?: Record<string, unknown>
): void {
  if (!organizationId) return;
  
  broadcast(organizationId, {
    type: eventType,
    timestamp: new Date().toISOString(),
    payload: {
      ...additionalData,
      entity: {
        id: entity.id,
        name: entity.name || entity.title,
        status: entity.status,
        ...entity,
      },
      userId,
    },
  });
}

// Wrapper for authenticated API handlers with error handling
export function withAuthHandler(
  handler: (request: NextRequest, context: ApiContext, params?: unknown) => Promise<NextResponse>
) {
  return withErrorHandler(async (request: NextRequest, params?: unknown) => {
    const { context, error } = await getApiContext();
    
    if (error) {
      return error;
    }
    
    return handler(request, context!, params);
  });
}
