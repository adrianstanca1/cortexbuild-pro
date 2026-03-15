// =====================================================
// SERVICE HEALTH MONITORING SYSTEM
// Real-time health checks and status tracking
// =====================================================

import { prisma } from "@/lib/db";
import {
  serviceRegistry,
  getAllServiceInstances,
  ServiceStatus,
} from "./service-registry";
import {
  SendGridAdapter,
  AIAdapter,
  TwilioAdapter,
  StripeAdapter,
} from "./service-adapters";
import { broadcastToAll } from "./realtime-clients";
import { createLogger } from "./logger";

const logger = createLogger("service-health");

// Health check result
export interface HealthCheckResult {
  serviceId: string;
  serviceName: string;
  status: ServiceStatus;
  responseTime?: number;
  lastChecked: Date;
  errorMessage?: string;
  details?: Record<string, any>;
}

// Overall system health
export interface SystemHealth {
  status: "HEALTHY" | "DEGRADED" | "UNHEALTHY";
  totalServices: number;
  activeServices: number;
  configuredServices: number;
  failedServices: number;
  lastChecked: Date;
  services: HealthCheckResult[];
}

// Service-specific health checkers
const healthCheckers: Record<string, () => Promise<HealthCheckResult>> = {
  sendgrid: async () => {
    const adapter = new SendGridAdapter();
    const result = await adapter.testConnection();
    return {
      serviceId: "sendgrid",
      serviceName: "SendGrid",
      status: result.success ? "ACTIVE" : "DISCONNECTED",
      responseTime: result.responseTime,
      lastChecked: new Date(),
      errorMessage: result.error,
    };
  },
  openai: async () => {
    const adapter = new AIAdapter();
    const result = await adapter.testConnection();
    return {
      serviceId: "openai",
      serviceName: "OpenAI / Abacus AI",
      status: result.success ? "ACTIVE" : "DISCONNECTED",
      responseTime: result.responseTime,
      lastChecked: new Date(),
      errorMessage: result.error,
    };
  },
  twilio: async () => {
    const adapter = new TwilioAdapter();
    const result = await adapter.testConnection();
    return {
      serviceId: "twilio",
      serviceName: "Twilio",
      status: result.success ? "ACTIVE" : "DISCONNECTED",
      responseTime: result.responseTime,
      lastChecked: new Date(),
      errorMessage: result.error,
    };
  },
  stripe: async () => {
    const adapter = new StripeAdapter();
    const result = await adapter.testConnection();
    return {
      serviceId: "stripe",
      serviceName: "Stripe",
      status: result.success ? "ACTIVE" : "DISCONNECTED",
      responseTime: result.responseTime,
      lastChecked: new Date(),
      errorMessage: result.error,
    };
  },
  postgresql: async () => {
    const startTime = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        serviceId: "postgresql",
        serviceName: "PostgreSQL Database",
        status: "ACTIVE",
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        serviceId: "postgresql",
        serviceName: "PostgreSQL Database",
        status: "DISCONNECTED",
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        errorMessage:
          error instanceof Error ? error.message : "Database connection failed",
      };
    }
  },
  webhooks: async () => {
    // Check if webhooks are configured
    const webhooks = await prisma.webhook.count({ where: { isActive: true } });
    return {
      serviceId: "webhooks",
      serviceName: "Webhook Dispatcher",
      status: "ACTIVE",
      lastChecked: new Date(),
      details: { activeWebhooks: webhooks },
    };
  },
  "realtime-sse": async () => {
    // Real-time is always available if server is running
    return {
      serviceId: "realtime-sse",
      serviceName: "Real-time Events (SSE)",
      status: "ACTIVE",
      lastChecked: new Date(),
    };
  },
};

/**
 * Check health of a single service
 */
export async function checkServiceHealth(
  serviceId: string,
): Promise<HealthCheckResult> {
  const checker = healthCheckers[serviceId];

  if (checker) {
    try {
      const result = await checker();

      // Update status in database if connection exists
      await updateServiceStatus(serviceId, result.status, result.errorMessage);

      return result;
    } catch (error) {
      return {
        serviceId,
        serviceName: serviceRegistry.getService(serviceId)?.name || serviceId,
        status: "DISCONNECTED",
        lastChecked: new Date(),
        errorMessage:
          error instanceof Error ? error.message : "Health check failed",
      };
    }
  }

  // For services without custom checkers, check if configured
  const instances = await getAllServiceInstances();
  const instance = instances.find((i) => i.definition.id === serviceId);

  return {
    serviceId,
    serviceName: instance?.definition.name || serviceId,
    status: instance?.status || "NOT_CONFIGURED",
    lastChecked: new Date(),
  };
}

/**
 * Check health of all services
 */
export async function checkAllServicesHealth(): Promise<SystemHealth> {
  const services = serviceRegistry.getAllServices();
  const results: HealthCheckResult[] = [];

  for (const service of services) {
    const result = await checkServiceHealth(service.id);
    results.push(result);
  }

  const activeCount = results.filter((r) => r.status === "ACTIVE").length;
  const configuredCount = results.filter(
    (r) => r.status !== "NOT_CONFIGURED",
  ).length;
  const failedCount = results.filter(
    (r) =>
      r.status === "DISCONNECTED" ||
      r.status === "INVALID" ||
      r.status === "EXPIRED",
  ).length;

  let overallStatus: "HEALTHY" | "DEGRADED" | "UNHEALTHY" = "HEALTHY";
  if (failedCount > 0) {
    // Check if any core service failed
    const coreServices = serviceRegistry.getCoreServices();
    const coreFailures = results.filter(
      (r) =>
        coreServices.some((c) => c.id === r.serviceId) &&
        (r.status === "DISCONNECTED" ||
          r.status === "INVALID" ||
          r.status === "EXPIRED"),
    );

    if (coreFailures.length > 0) {
      overallStatus = "UNHEALTHY";
    } else {
      overallStatus = "DEGRADED";
    }
  }

  return {
    status: overallStatus,
    totalServices: services.length,
    activeServices: activeCount,
    configuredServices: configuredCount,
    failedServices: failedCount,
    lastChecked: new Date(),
    services: results,
  };
}

/**
 * Update service status in database
 */
async function updateServiceStatus(
  serviceId: string,
  status: ServiceStatus,
  errorMessage?: string,
): Promise<void> {
  try {
    const connection = await prisma.apiConnection.findFirst({
      where: { serviceName: serviceId.toLowerCase() },
      orderBy: { createdAt: "desc" },
    });

    if (connection) {
      const dbStatus =
        status === "ACTIVE"
          ? "ACTIVE"
          : status === "INACTIVE"
            ? "INACTIVE"
            : status === "EXPIRED"
              ? "EXPIRED"
              : "ERROR";

      await prisma.apiConnection.update({
        where: { id: connection.id },
        data: {
          status: dbStatus,
          lastValidatedAt: new Date(),
          lastErrorMessage: errorMessage || null,
        },
      });
    }
  } catch (error) {
    logger.error(`Failed to update service status for ${serviceId}:`, error);
  }
}

/**
 * Broadcast service status change
 */
export function broadcastServiceStatusChange(
  serviceId: string,
  status: ServiceStatus,
  details?: Record<string, any>,
): void {
  try {
    broadcastToAll({
      type: "service_status_changed",
      data: {
        serviceId,
        status,
        timestamp: new Date().toISOString(),
        ...details,
      },
    });
  } catch (error) {
    logger.error("Failed to broadcast service status change:", error);
  }
}

/**
 * Get service uptime statistics
 */
export async function getServiceUptimeStats(
  serviceId: string,
  days: number = 30,
): Promise<{
  totalChecks: number;
  successfulChecks: number;
  uptimePercentage: number;
  averageResponseTime: number;
}> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const logs = await prisma.apiConnectionLog.findMany({
    where: {
      connection: { serviceName: serviceId.toLowerCase() },
      createdAt: { gte: since },
      action: { in: ["TEST", "API_CALL"] },
    },
    select: {
      details: true,
    },
  });

  const totalChecks = logs.length;
  let successfulChecks = 0;
  let totalResponseTime = 0;
  let responseTimeCount = 0;

  for (const log of logs) {
    const details = (log.details as Record<string, any>) || {};
    if (details.success === true || details.status === "success") {
      successfulChecks++;
    }
    if (typeof details.responseTime === "number") {
      totalResponseTime += details.responseTime;
      responseTimeCount++;
    }
  }

  return {
    totalChecks,
    successfulChecks,
    uptimePercentage:
      totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0,
    averageResponseTime:
      responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0,
  };
}

/**
 * Service dependency checker
 * Checks if all required services for a module are configured
 */
export async function checkModuleDependencies(moduleId: string): Promise<{
  allConfigured: boolean;
  missingServices: string[];
  configuredServices: string[];
}> {
  const requiredServices = serviceRegistry.getServicesForModule(moduleId);
  const missingServices: string[] = [];
  const configuredServices: string[] = [];

  for (const service of requiredServices) {
    const dependency = service.dependencies.find(
      (d) => d.moduleId === moduleId || d.moduleId === "all",
    );

    if (dependency?.isRequired) {
      const health = await checkServiceHealth(service.id);
      if (health.status === "NOT_CONFIGURED") {
        missingServices.push(service.name);
      } else {
        configuredServices.push(service.name);
      }
    }
  }

  return {
    allConfigured: missingServices.length === 0,
    missingServices,
    configuredServices,
  };
}
