/**
 * OpenAPI/Swagger Specification Generator
 * 
 * Generates OpenAPI 3.0 specification for the CortexBuild Pro API
 */

export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'CortexBuild Pro API',
    version: '1.0.0',
    description: 'Enterprise construction management platform API',
    contact: {
      name: 'CortexBuild Pro Support',
      email: 'support@cortexbuild.com',
    },
    license: {
      name: 'Proprietary',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
    {
      url: 'https://cortexbuildpro.abacusai.app',
      description: 'Production server',
    },
  ],
  tags: [
    { name: 'Authentication', description: 'User authentication and authorization' },
    { name: 'Projects', description: 'Project management operations' },
    { name: 'Tasks', description: 'Task management operations' },
    { name: 'RFIs', description: 'Request for Information management' },
    { name: 'Submittals', description: 'Submittal management' },
    { name: 'Documents', description: 'Document management' },
    { name: 'Team', description: 'Team member management' },
    { name: 'Safety', description: 'Safety incident management' },
    { name: 'Time Tracking', description: 'Time entry management' },
    { name: 'Daily Reports', description: 'Daily report management' },
    { name: 'Admin', description: 'Administrative operations' },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'next-auth.session-token',
      },
      csrfToken: {
        type: 'apiKey',
        in: 'header',
        name: 'x-csrf-token',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        required: ['error', 'message'],
        properties: {
          error: {
            type: 'string',
            description: 'Error type',
          },
          message: {
            type: 'string',
            description: 'Human-readable error message',
          },
          errors: {
            type: 'object',
            description: 'Validation errors (field-level)',
            additionalProperties: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      },
      User: {
        type: 'object',
        required: ['id', 'email', 'name', 'role', 'organizationId'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          role: {
            type: 'string',
            enum: ['SUPER_ADMIN', 'COMPANY_OWNER', 'ADMIN', 'PROJECT_MANAGER', 'FIELD_WORKER'],
          },
          organizationId: { type: 'string', format: 'uuid' },
          active: { type: 'boolean' },
          emailVerified: { type: 'string', format: 'date-time', nullable: true },
          lastLogin: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Project: {
        type: 'object',
        required: ['id', 'name', 'status', 'organizationId'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          status: {
            type: 'string',
            enum: ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'],
          },
          startDate: { type: 'string', format: 'date-time', nullable: true },
          endDate: { type: 'string', format: 'date-time', nullable: true },
          budget: { type: 'number', nullable: true },
          location: { type: 'string', nullable: true },
          clientName: { type: 'string', nullable: true },
          organizationId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Task: {
        type: 'object',
        required: ['id', 'title', 'status', 'priority', 'projectId'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          status: {
            type: 'string',
            enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETE'],
          },
          priority: {
            type: 'string',
            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
          },
          projectId: { type: 'string', format: 'uuid' },
          assigneeId: { type: 'string', format: 'uuid', nullable: true },
          dueDate: { type: 'string', format: 'date-time', nullable: true },
          estimatedHours: { type: 'number', nullable: true },
          tags: { type: 'array', items: { type: 'string' } },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            minimum: 1,
            default: 1,
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20,
          },
          total: {
            type: 'integer',
          },
          totalPages: {
            type: 'integer',
          },
        },
      },
    },
  },
  paths: {
    '/api/auth/signin': {
      post: {
        tags: ['Authentication'],
        summary: 'Sign in user',
        description: 'Authenticate user with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Successful authentication',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                    token: { type: 'string' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '429': {
            description: 'Too many requests',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/projects': {
      get: {
        tags: ['Projects'],
        summary: 'List projects',
        description: 'Get a list of projects for the authenticated user',
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'],
            },
          },
        ],
        responses: {
          '200': {
            description: 'List of projects',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    projects: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Project' },
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Projects'],
        summary: 'Create project',
        description: 'Create a new project',
        security: [{ cookieAuth: [], csrfToken: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', minLength: 1, maxLength: 200 },
                  description: { type: 'string', maxLength: 2000 },
                  status: {
                    type: 'string',
                    enum: ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'],
                    default: 'PLANNING',
                  },
                  startDate: { type: 'string', format: 'date-time' },
                  endDate: { type: 'string', format: 'date-time' },
                  budget: { type: 'number', minimum: 0 },
                  location: { type: 'string', maxLength: 500 },
                  clientName: { type: 'string', maxLength: 200 },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Project created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Project' },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '403': {
            description: 'CSRF token missing or invalid',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/csrf-token': {
      get: {
        tags: ['Authentication'],
        summary: 'Get CSRF token',
        description: 'Get a CSRF token for making state-changing requests',
        responses: {
          '200': {
            description: 'CSRF token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    csrfToken: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

/**
 * Get OpenAPI specification as JSON
 */
export function getOpenApiSpec(): string {
  return JSON.stringify(openApiSpec, null, 2);
}
