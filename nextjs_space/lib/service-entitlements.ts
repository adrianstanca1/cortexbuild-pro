// =====================================================
// SERVICE ENTITLEMENTS SYSTEM
// Controls feature availability based on configured services
// =====================================================

import { isServiceConfigured, serviceRegistry, ServiceEnvironment } from "./service-registry";

// Service module entitlement status
export interface ServiceModuleEntitlement {
  moduleId: string;
  moduleName: string;
  isEnabled: boolean;
  requiredServices: string[];
  configuredServices: string[];
  missingServices: string[];
  degradedMode?: boolean;
  degradedFeatures?: string[];
}

// Platform entitlements overview
export interface PlatformEntitlements {
  coreServicesConfigured: boolean;
  modules: ServiceModuleEntitlement[];
  features: {
    emailNotifications: boolean;
    smsAlerts: boolean;
    aiAssistant: boolean;
    paymentProcessing: boolean;
    pushNotifications: boolean;
    analytics: boolean;
  };
}

// Module definitions with service dependencies
const MODULE_DEFINITIONS: Record<string, { name: string; requiredServices: string[]; optionalServices: string[] }> = {
  "company-invitations": {
    name: "Company Invitations",
    requiredServices: ["sendgrid"],
    optionalServices: []
  },
  "team-invitations": {
    name: "Team Invitations",
    requiredServices: ["sendgrid"],
    optionalServices: []
  },
  "password-reset": {
    name: "Password Reset",
    requiredServices: ["sendgrid"],
    optionalServices: []
  },
  "notifications": {
    name: "Email Notifications",
    requiredServices: [],
    optionalServices: ["sendgrid", "firebase"]
  },
  "sms-alerts": {
    name: "SMS Alerts",
    requiredServices: ["twilio"],
    optionalServices: []
  },
  "ai-assistant": {
    name: "AI Assistant",
    requiredServices: ["openai"],
    optionalServices: []
  },
  "document-analysis": {
    name: "Document Analysis",
    requiredServices: [],
    optionalServices: ["openai"]
  },
  "project-intelligence": {
    name: "Project Intelligence",
    requiredServices: [],
    optionalServices: ["openai"]
  },
  "billing": {
    name: "Billing & Subscriptions",
    requiredServices: ["stripe"],
    optionalServices: []
  },
  "documents": {
    name: "Document Management",
    requiredServices: ["aws-s3"],
    optionalServices: []
  },
  "photos": {
    name: "Photo Gallery",
    requiredServices: ["aws-s3"],
    optionalServices: []
  },
  "push-notifications": {
    name: "Push Notifications",
    requiredServices: ["firebase"],
    optionalServices: []
  },
  "analytics": {
    name: "Platform Analytics",
    requiredServices: [],
    optionalServices: ["google-analytics"]
  }
};

/**
 * Check if a specific module is enabled based on service configuration
 */
export async function isServiceModuleEnabled(
  moduleId: string,
  environment: ServiceEnvironment = "PRODUCTION"
): Promise<boolean> {
  const moduleDef = MODULE_DEFINITIONS[moduleId];
  if (!moduleDef) return true; // Unknown modules are enabled by default

  // Check if all required services are configured
  for (const serviceId of moduleDef.requiredServices) {
    const configured = await isServiceConfigured(serviceId, environment);
    if (!configured) return false;
  }

  return true;
}

/**
 * Get entitlement status for a specific module
 */
export async function getServiceModuleEntitlement(
  moduleId: string,
  environment: ServiceEnvironment = "PRODUCTION"
): Promise<ServiceModuleEntitlement> {
  const moduleDef = MODULE_DEFINITIONS[moduleId];
  
  if (!moduleDef) {
    return {
      moduleId,
      moduleName: moduleId,
      isEnabled: true,
      requiredServices: [],
      configuredServices: [],
      missingServices: []
    };
  }

  const configuredServices: string[] = [];
  const missingServices: string[] = [];

  for (const serviceId of moduleDef.requiredServices) {
    const configured = await isServiceConfigured(serviceId, environment);
    if (configured) {
      configuredServices.push(serviceId);
    } else {
      missingServices.push(serviceId);
    }
  }

  // Check optional services for degraded mode
  const degradedFeatures: string[] = [];
  for (const serviceId of moduleDef.optionalServices) {
    const configured = await isServiceConfigured(serviceId, environment);
    if (configured) {
      configuredServices.push(serviceId);
    } else {
      const service = serviceRegistry.getService(serviceId);
      if (service) {
        degradedFeatures.push(service.name);
      }
    }
  }

  return {
    moduleId,
    moduleName: moduleDef.name,
    isEnabled: missingServices.length === 0,
    requiredServices: moduleDef.requiredServices,
    configuredServices,
    missingServices,
    degradedMode: missingServices.length === 0 && degradedFeatures.length > 0,
    degradedFeatures: degradedFeatures.length > 0 ? degradedFeatures : undefined
  };
}

/**
 * Get complete platform entitlements overview
 */
export async function getPlatformEntitlements(
  environment: ServiceEnvironment = "PRODUCTION"
): Promise<PlatformEntitlements> {
  // Check core services
  const coreServices = serviceRegistry.getCoreServices();
  let coreServicesConfigured = true;
  
  for (const service of coreServices) {
    // Skip internal services that don't need configuration
    if (service.id === "realtime-sse" || service.id === "webhooks") continue;
    
    const configured = await isServiceConfigured(service.id, environment);
    if (!configured && service.credentialFields.length > 0) {
      coreServicesConfigured = false;
      break;
    }
  }

  // Get module entitlements
  const modules: ServiceModuleEntitlement[] = [];
  for (const moduleId of Object.keys(MODULE_DEFINITIONS)) {
    const entitlement = await getServiceModuleEntitlement(moduleId, environment);
    modules.push(entitlement);
  }

  // Feature flags
  const features = {
    emailNotifications: await isServiceConfigured("sendgrid", environment),
    smsAlerts: await isServiceConfigured("twilio", environment),
    aiAssistant: await isServiceConfigured("openai", environment),
    paymentProcessing: await isServiceConfigured("stripe", environment),
    pushNotifications: await isServiceConfigured("firebase", environment),
    analytics: await isServiceConfigured("google-analytics", environment)
  };

  return {
    coreServicesConfigured,
    modules,
    features
  };
}

/**
 * Middleware helper to check module access
 */
export async function requireServiceModule(
  moduleId: string,
  environment: ServiceEnvironment = "PRODUCTION"
): Promise<{ allowed: boolean; reason?: string }> {
  const entitlement = await getServiceModuleEntitlement(moduleId, environment);
  
  if (!entitlement.isEnabled) {
    const missingNames = entitlement.missingServices
      .map((id: string) => serviceRegistry.getService(id)?.name || id)
      .join(", ");
    
    return {
      allowed: false,
      reason: `This feature requires the following services to be configured: ${missingNames}`
    };
  }

  return { allowed: true };
}

/**
 * Get services that need to be configured for a feature
 */
export function getRequiredServicesForModule(moduleId: string): string[] {
  const moduleDef = MODULE_DEFINITIONS[moduleId];
  return moduleDef?.requiredServices || [];
}

/**
 * Check if email sending is available (with fallback awareness)
 */
export async function isEmailAvailable(
  environment: ServiceEnvironment = "PRODUCTION"
): Promise<{ available: boolean; provider: "sendgrid" | "nodemailer" | "none" }> {
  const sendgridConfigured = await isServiceConfigured("sendgrid", environment);

  if (sendgridConfigured) {
    return { available: true, provider: "sendgrid" };
  }

  // Check if nodemailer fallback is available (always available if SMTP credentials are set)
  const nodemailerAvailable = !!(process.env.SMTP_HOST && process.env.SMTP_USER);

  if (nodemailerAvailable) {
    return { available: true, provider: "nodemailer" };
  }

  return { available: false, provider: "none" };
}
