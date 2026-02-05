// =====================================================
// PLUG-AND-PLAY SERVICE REGISTRY
// Dynamic API Integration Framework
// =====================================================

import { prisma } from "@/lib/db";
import { decryptCredentials } from "@/lib/encryption";

// Service status types
export type ServiceStatus = "ACTIVE" | "INACTIVE" | "DISCONNECTED" | "INVALID" | "EXPIRED" | "NOT_CONFIGURED";

// Environment types
export type ServiceEnvironment = "DEVELOPMENT" | "STAGING" | "PRODUCTION";

// Service category types
export type ServiceCategory = 
  | "EMAIL"
  | "AI_PROCESSING"
  | "PAYMENTS"
  | "STORAGE"
  | "DATABASE"
  | "NOTIFICATIONS"
  | "AUTHENTICATION"
  | "ANALYTICS"
  | "COMMUNICATION"
  | "INTERNAL"
  | "CUSTOM";

// Credential field definition
export interface CredentialField {
  key: string;
  label: string;
  type: "text" | "password" | "url" | "number";
  required: boolean;
  placeholder?: string;
  helpText?: string;
}

// Module dependency definition
export interface ModuleDependency {
  moduleId: string;
  moduleName: string;
  usageDescription: string;
  isRequired: boolean;
}

// Service definition for the registry
export interface ServiceDefinition {
  id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  icon?: string;
  baseUrl: string;
  docsUrl?: string;
  credentialFields: CredentialField[];
  isBuiltIn: boolean;
  isPlatformCore: boolean; // Core platform services that are required
  defaultEnvironment: ServiceEnvironment;
  supportedEnvironments: ServiceEnvironment[];
  dependencies: ModuleDependency[];
  testEndpoint?: string;
  testMethod?: "GET" | "POST" | "HEAD";
  testHeaders?: Record<string, string>;
  healthCheckFn?: (credentials: Record<string, string>) => Promise<{ success: boolean; message?: string; responseTime?: number }>;
}

// Runtime service instance with status
export interface ServiceInstance {
  definition: ServiceDefinition;
  status: ServiceStatus;
  environment: ServiceEnvironment;
  isConfigured: boolean;
  connectionId?: string;
  lastValidatedAt?: Date;
  lastErrorMessage?: string;
  credentials?: Record<string, string>; // Only populated when needed
}

// =====================================================
// BUILT-IN PLATFORM SERVICES REGISTRY
// =====================================================

export const PLATFORM_SERVICES: ServiceDefinition[] = [
  // EMAIL SERVICES
  {
    id: "sendgrid",
    name: "SendGrid",
    description: "Transactional email delivery for invitations, notifications, and alerts",
    category: "EMAIL",
    icon: "Mail",
    baseUrl: "https://api.sendgrid.com/v3",
    docsUrl: "https://docs.sendgrid.com/api-reference",
    credentialFields: [
      { key: "apiKey", label: "API Key", type: "password", required: true, placeholder: "SG.xxxx", helpText: "SendGrid API key starting with SG." },
      { key: "fromEmail", label: "From Email", type: "text", required: false, placeholder: "noreply@yourdomain.com" },
      { key: "fromName", label: "From Name", type: "text", required: false, placeholder: "CortexBuild Pro" }
    ],
    isBuiltIn: true,
    isPlatformCore: true,
    defaultEnvironment: "PRODUCTION",
    supportedEnvironments: ["DEVELOPMENT", "STAGING", "PRODUCTION"],
    dependencies: [
      { moduleId: "company-invitations", moduleName: "Company Invitations", usageDescription: "Send invitation emails to new company owners", isRequired: true },
      { moduleId: "team-invitations", moduleName: "Team Invitations", usageDescription: "Send team member invitation emails", isRequired: true },
      { moduleId: "notifications", moduleName: "Notifications", usageDescription: "Email notifications for system events", isRequired: false },
      { moduleId: "password-reset", moduleName: "Password Reset", usageDescription: "Password reset email delivery", isRequired: true }
    ],
    testEndpoint: "/mail/send",
    testMethod: "POST"
  },

  // AI PROCESSING SERVICES
  {
    id: "openai",
    name: "OpenAI / Abacus AI",
    description: "AI-powered document analysis, intelligent suggestions, and natural language processing",
    category: "AI_PROCESSING",
    icon: "Brain",
    baseUrl: "https://api.openai.com/v1",
    docsUrl: "https://platform.openai.com/docs/api-reference",
    credentialFields: [
      { key: "apiKey", label: "API Key", type: "password", required: true, placeholder: "sk-xxxx" },
      { key: "organizationId", label: "Organization ID", type: "text", required: false, placeholder: "org-xxxx" },
      { key: "model", label: "Default Model", type: "text", required: false, placeholder: "gpt-4" }
    ],
    isBuiltIn: true,
    isPlatformCore: false,
    defaultEnvironment: "PRODUCTION",
    supportedEnvironments: ["DEVELOPMENT", "STAGING", "PRODUCTION"],
    dependencies: [
      { moduleId: "ai-assistant", moduleName: "AI Assistant", usageDescription: "Intelligent project assistant and recommendations", isRequired: true },
      { moduleId: "document-analysis", moduleName: "Document Analysis", usageDescription: "AI-powered document parsing and extraction", isRequired: false },
      { moduleId: "project-intelligence", moduleName: "Project Intelligence", usageDescription: "Risk analysis and predictive insights", isRequired: false }
    ],
    testEndpoint: "/models",
    testMethod: "GET"
  },

  // PAYMENT SERVICES
  {
    id: "stripe",
    name: "Stripe",
    description: "Payment processing for subscriptions and billing",
    category: "PAYMENTS",
    icon: "CreditCard",
    baseUrl: "https://api.stripe.com/v1",
    docsUrl: "https://stripe.com/docs/api",
    credentialFields: [
      { key: "secretKey", label: "Secret Key", type: "password", required: true, placeholder: "sk_live_xxxx" },
      { key: "publishableKey", label: "Publishable Key", type: "text", required: true, placeholder: "pk_live_xxxx" },
      { key: "webhookSecret", label: "Webhook Secret", type: "password", required: false, placeholder: "whsec_xxxx" }
    ],
    isBuiltIn: true,
    isPlatformCore: false,
    defaultEnvironment: "PRODUCTION",
    supportedEnvironments: ["DEVELOPMENT", "STAGING", "PRODUCTION"],
    dependencies: [
      { moduleId: "billing", moduleName: "Billing & Subscriptions", usageDescription: "Process subscription payments", isRequired: true },
      { moduleId: "invoicing", moduleName: "Invoicing", usageDescription: "Generate and process invoices", isRequired: false }
    ],
    testEndpoint: "/balance",
    testMethod: "GET"
  },

  // CLOUD STORAGE
  {
    id: "aws-s3",
    name: "AWS S3",
    description: "Cloud storage for documents, photos, and file uploads",
    category: "STORAGE",
    icon: "Cloud",
    baseUrl: "",
    docsUrl: "https://docs.aws.amazon.com/s3/",
    credentialFields: [
      { key: "accessKeyId", label: "Access Key ID", type: "text", required: true },
      { key: "secretAccessKey", label: "Secret Access Key", type: "password", required: true },
      { key: "region", label: "Region", type: "text", required: true, placeholder: "us-east-1" },
      { key: "bucketName", label: "Bucket Name", type: "text", required: true }
    ],
    isBuiltIn: true,
    isPlatformCore: true,
    defaultEnvironment: "PRODUCTION",
    supportedEnvironments: ["DEVELOPMENT", "STAGING", "PRODUCTION"],
    dependencies: [
      { moduleId: "documents", moduleName: "Document Management", usageDescription: "Store and retrieve project documents", isRequired: true },
      { moduleId: "photos", moduleName: "Photo Gallery", usageDescription: "Store project and safety photos", isRequired: true },
      { moduleId: "daily-reports", moduleName: "Daily Reports", usageDescription: "Store daily report attachments", isRequired: false }
    ]
  },

  // DATABASE
  {
    id: "postgresql",
    name: "PostgreSQL Database",
    description: "Primary database for application data storage",
    category: "DATABASE",
    icon: "Database",
    baseUrl: "",
    credentialFields: [
      { key: "connectionString", label: "Connection String", type: "password", required: true, placeholder: "postgresql://user:pass@host:5432/db" }
    ],
    isBuiltIn: true,
    isPlatformCore: true,
    defaultEnvironment: "PRODUCTION",
    supportedEnvironments: ["DEVELOPMENT", "STAGING", "PRODUCTION"],
    dependencies: [
      { moduleId: "all", moduleName: "All Modules", usageDescription: "Core data persistence layer", isRequired: true }
    ]
  },

  // COMMUNICATION
  {
    id: "twilio",
    name: "Twilio",
    description: "SMS notifications and voice communications",
    category: "COMMUNICATION",
    icon: "MessageSquare",
    baseUrl: "https://api.twilio.com/2010-04-01",
    docsUrl: "https://www.twilio.com/docs/api",
    credentialFields: [
      { key: "accountSid", label: "Account SID", type: "text", required: true, placeholder: "ACxxxx" },
      { key: "authToken", label: "Auth Token", type: "password", required: true },
      { key: "phoneNumber", label: "Phone Number", type: "text", required: false, placeholder: "+1234567890" }
    ],
    isBuiltIn: true,
    isPlatformCore: false,
    defaultEnvironment: "PRODUCTION",
    supportedEnvironments: ["DEVELOPMENT", "STAGING", "PRODUCTION"],
    dependencies: [
      { moduleId: "sms-alerts", moduleName: "SMS Alerts", usageDescription: "Send SMS notifications for critical events", isRequired: true },
      { moduleId: "safety", moduleName: "Safety Module", usageDescription: "Emergency SMS alerts for safety incidents", isRequired: false }
    ],
    testEndpoint: "/Accounts/{accountSid}.json",
    testMethod: "GET"
  },

  // PUSH NOTIFICATIONS
  {
    id: "firebase",
    name: "Firebase Cloud Messaging",
    description: "Push notifications for mobile and web applications",
    category: "NOTIFICATIONS",
    icon: "Bell",
    baseUrl: "https://fcm.googleapis.com/v1",
    docsUrl: "https://firebase.google.com/docs/cloud-messaging",
    credentialFields: [
      { key: "projectId", label: "Project ID", type: "text", required: true },
      { key: "privateKey", label: "Private Key", type: "password", required: true },
      { key: "clientEmail", label: "Client Email", type: "text", required: true }
    ],
    isBuiltIn: true,
    isPlatformCore: false,
    defaultEnvironment: "PRODUCTION",
    supportedEnvironments: ["DEVELOPMENT", "STAGING", "PRODUCTION"],
    dependencies: [
      { moduleId: "push-notifications", moduleName: "Push Notifications", usageDescription: "Real-time push notifications", isRequired: true }
    ]
  },

  // WEBHOOKS (Internal)
  {
    id: "webhooks",
    name: "Webhook Dispatcher",
    description: "Internal webhook system for third-party integrations",
    category: "INTERNAL",
    icon: "Webhook",
    baseUrl: "",
    credentialFields: [
      { key: "signingSecret", label: "Signing Secret", type: "password", required: true, helpText: "HMAC secret for webhook signatures" }
    ],
    isBuiltIn: true,
    isPlatformCore: true,
    defaultEnvironment: "PRODUCTION",
    supportedEnvironments: ["PRODUCTION"],
    dependencies: [
      { moduleId: "external-integrations", moduleName: "External Integrations", usageDescription: "Trigger webhooks on system events", isRequired: true }
    ]
  },

  // REAL-TIME
  {
    id: "realtime-sse",
    name: "Real-time Events (SSE)",
    description: "Server-Sent Events for live updates and notifications",
    category: "INTERNAL",
    icon: "Radio",
    baseUrl: "/api/realtime",
    credentialFields: [],
    isBuiltIn: true,
    isPlatformCore: true,
    defaultEnvironment: "PRODUCTION",
    supportedEnvironments: ["DEVELOPMENT", "STAGING", "PRODUCTION"],
    dependencies: [
      { moduleId: "dashboard", moduleName: "Dashboard", usageDescription: "Live dashboard updates", isRequired: true },
      { moduleId: "tasks", moduleName: "Tasks", usageDescription: "Real-time task updates", isRequired: true },
      { moduleId: "notifications", moduleName: "Notifications", usageDescription: "Instant notification delivery", isRequired: true }
    ]
  },

  // ANALYTICS
  {
    id: "google-analytics",
    name: "Google Analytics",
    description: "Website analytics and user behavior tracking",
    category: "ANALYTICS",
    icon: "BarChart",
    baseUrl: "",
    docsUrl: "https://developers.google.com/analytics",
    credentialFields: [
      { key: "measurementId", label: "Measurement ID", type: "text", required: true, placeholder: "G-XXXXXXXXXX" }
    ],
    isBuiltIn: true,
    isPlatformCore: false,
    defaultEnvironment: "PRODUCTION",
    supportedEnvironments: ["PRODUCTION"],
    dependencies: [
      { moduleId: "analytics", moduleName: "Platform Analytics", usageDescription: "Track user behavior and platform usage", isRequired: true }
    ]
  }
];

// =====================================================
// SERVICE REGISTRY CLASS
// =====================================================

class ServiceRegistry {
  private services: Map<string, ServiceDefinition> = new Map();
  private customServices: ServiceDefinition[] = [];

  constructor() {
    // Initialize with built-in services
    PLATFORM_SERVICES.forEach(service => {
      this.services.set(service.id, service);
    });
  }

  // Get all registered services
  getAllServices(): ServiceDefinition[] {
    return [...this.services.values(), ...this.customServices];
  }

  // Get service by ID
  getService(id: string): ServiceDefinition | undefined {
    return this.services.get(id) || this.customServices.find(s => s.id === id);
  }

  // Get services by category
  getServicesByCategory(category: ServiceCategory): ServiceDefinition[] {
    return this.getAllServices().filter(s => s.category === category);
  }

  // Get built-in platform services
  getBuiltInServices(): ServiceDefinition[] {
    return PLATFORM_SERVICES;
  }

  // Get core platform services (required for operation)
  getCoreServices(): ServiceDefinition[] {
    return PLATFORM_SERVICES.filter(s => s.isPlatformCore);
  }

  // Register a custom service dynamically
  registerService(service: ServiceDefinition): void {
    if (this.services.has(service.id)) {
      throw new Error(`Service with ID '${service.id}' already exists`);
    }
    this.customServices.push(service);
  }

  // Unregister a custom service
  unregisterService(id: string): boolean {
    const index = this.customServices.findIndex(s => s.id === id);
    if (index !== -1) {
      this.customServices.splice(index, 1);
      return true;
    }
    return false;
  }

  // Get modules that depend on a specific service
  getDependentModules(serviceId: string): ModuleDependency[] {
    const service = this.getService(serviceId);
    return service?.dependencies || [];
  }

  // Get services required by a specific module
  getServicesForModule(moduleId: string): ServiceDefinition[] {
    return this.getAllServices().filter(service =>
      service.dependencies.some(dep => dep.moduleId === moduleId || dep.moduleId === "all")
    );
  }
}

// Singleton instance
export const serviceRegistry = new ServiceRegistry();

// =====================================================
// DYNAMIC CREDENTIALS FETCHER
// =====================================================

export interface ServiceCredentials {
  credentials: Record<string, string>;
  environment: ServiceEnvironment;
  baseUrl: string;
  isActive: boolean;
  connectionId: string;
}

/**
 * Fetches credentials for a service dynamically from the database
 * This is the core function that enables plug-and-play API management
 */
export async function getServiceCredentials(
  serviceId: string,
  environment: ServiceEnvironment = "PRODUCTION"
): Promise<ServiceCredentials | null> {
  try {
    const connection = await prisma.apiConnection.findFirst({
      where: {
        serviceName: serviceId.toLowerCase(),
        environment,
        isEnabled: true,
        status: { in: ["ACTIVE", "INACTIVE"] } // Allow INACTIVE for testing
      },
      orderBy: { createdAt: "desc" }
    });

    if (!connection) {
      return null;
    }

    const credentials = connection.credentials as Record<string, string>;
    const decrypted = decryptCredentials(credentials);

    return {
      credentials: decrypted,
      environment: connection.environment as ServiceEnvironment,
      baseUrl: connection.baseUrl || "",
      isActive: connection.status === "ACTIVE",
      connectionId: connection.id
    };
  } catch (error) {
    console.error(`Error fetching credentials for service ${serviceId}:`, error);
    return null;
  }
}

/**
 * Check if a service is configured and active
 */
export async function isServiceConfigured(
  serviceId: string,
  environment: ServiceEnvironment = "PRODUCTION"
): Promise<boolean> {
  const credentials = await getServiceCredentials(serviceId, environment);
  return credentials !== null && credentials.isActive;
}

/**
 * Get all service instances with their current status
 */
export async function getAllServiceInstances(
  environment?: ServiceEnvironment
): Promise<ServiceInstance[]> {
  const services = serviceRegistry.getAllServices();
  const instances: ServiceInstance[] = [];

  // Fetch all connections at once for efficiency
  const connections = await prisma.apiConnection.findMany({
    where: environment ? { environment } : {},
    orderBy: { createdAt: "desc" }
  });

  for (const service of services) {
    const envToCheck = environment || service.defaultEnvironment;
    const connection = connections.find(
      c => c.serviceName === service.id.toLowerCase() && c.environment === envToCheck
    );

    let status: ServiceStatus = "NOT_CONFIGURED";
    if (connection) {
      if (!connection.isEnabled) {
        status = "INACTIVE";
      } else {
        switch (connection.status) {
          case "ACTIVE":
            status = "ACTIVE";
            break;
          case "INACTIVE":
            status = "INACTIVE";
            break;
          case "ERROR":
            status = "DISCONNECTED";
            break;
          case "EXPIRED":
            status = "EXPIRED";
            break;
          case "DISABLED":
            status = "INACTIVE";
            break;
          default:
            status = "INVALID";
        }
      }
    }

    // Special handling for internal services that don't need external credentials
    if (service.category === "INTERNAL" && service.credentialFields.length === 0) {
      status = "ACTIVE";
    }

    instances.push({
      definition: service,
      status,
      environment: envToCheck,
      isConfigured: !!connection || (service.category === "INTERNAL" && service.credentialFields.length === 0),
      connectionId: connection?.id,
      lastValidatedAt: connection?.lastValidatedAt || undefined,
      lastErrorMessage: connection?.lastErrorMessage || undefined
    });
  }

  return instances;
}

/**
 * Log a service usage event
 */
export async function logServiceUsage(
  connectionId: string,
  action: string,
  details: any,
  success: boolean,
  responseTime?: number,
  errorMessage?: string
): Promise<void> {
  try {
    await prisma.apiConnectionLog.create({
      data: {
        connectionId,
        action,
        details,
        testSuccess: success,
        testResponseTime: responseTime,
        testErrorMessage: errorMessage
      }
    });

    // Update connection status based on result
    if (!success) {
      await prisma.apiConnection.update({
        where: { id: connectionId },
        data: {
          consecutiveErrors: { increment: 1 },
          lastErrorMessage: errorMessage,
          status: "ERROR"
        }
      });
    } else {
      await prisma.apiConnection.update({
        where: { id: connectionId },
        data: {
          consecutiveErrors: 0,
          lastValidatedAt: new Date(),
          status: "ACTIVE"
        }
      });
    }
  } catch (error) {
    console.error("Error logging service usage:", error);
  }
}
