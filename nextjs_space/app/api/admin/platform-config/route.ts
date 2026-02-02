import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToAll } from "@/lib/realtime-clients";

// Default platform configuration
const DEFAULT_CONFIG = {
  maintenanceMode: false,
  maintenanceMessage: "The platform is currently under maintenance. Please check back later.",
  allowSignups: true,
  maxProjectsPerOrg: 100,
  maxUsersPerOrg: 500,
  maxStoragePerOrg: 10737418240, // 10GB in bytes
  features: {
    aiAssistant: true,
    realTimeUpdates: true,
    webhooks: true,
    apiAccess: true,
    advancedReports: true,
    documentViewer: true,
    ganttChart: true,
    timeTracking: true,
    budgetManagement: true,
    safetyModule: true
  },
  notifications: {
    emailEnabled: true,
    slackEnabled: false,
    webhooksEnabled: true,
    pushEnabled: false
  },
  security: {
    mfaRequired: false,
    sessionTimeout: 86400, // 24 hours
    passwordMinLength: 8,
    maxLoginAttempts: 5,
    passwordExpireDays: 0, // 0 = never
    requireSpecialChars: true,
    ipWhitelist: [],
    auditLogRetentionDays: 90
  },
  branding: {
    platformName: "CortexBuild Pro",
    primaryColor: "#7c3aed",
    logoUrl: "",
    faviconUrl: "",
    supportEmail: "support@cortexbuild.com",
    supportUrl: ""
  },
  limits: {
    maxFileSize: 104857600, // 100MB
    maxDocumentsPerProject: 1000,
    maxTasksPerProject: 5000,
    maxTeamMembersPerProject: 100,
    apiRateLimit: 1000, // requests per hour
    maxConcurrentUploads: 5
  },
  modules: {
    projects: true,
    tasks: true,
    documents: true,
    rfis: true,
    submittals: true,
    dailyReports: true,
    safety: true,
    changeOrders: true,
    punchLists: true,
    meetings: true,
    equipment: true,
    materials: true,
    budget: true,
    timeTracking: true
  }
};

// In-memory cache with persistence layer
let platformConfig = { ...DEFAULT_CONFIG };
let lastLoadedAt: Date | null = null;

// Load config from database if available
async function loadConfigFromDb(): Promise<void> {
  try {
    const stored = await prisma.activityLog.findFirst({
      where: { action: "platform_config_stored", entityType: "SYSTEM" },
      orderBy: { createdAt: "desc" }
    });
    if (stored?.details) {
      const parsed = typeof stored.details === "string" ? JSON.parse(stored.details) : stored.details;
      platformConfig = deepMerge(DEFAULT_CONFIG, parsed);
    }
    lastLoadedAt = new Date();
  } catch (e) {
    console.error("Error loading platform config from DB:", e);
  }
}

// Deep merge utility
function deepMerge(target: any, source: any): any {
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Reload from DB if stale (>5 min)
    if (!lastLoadedAt || Date.now() - lastLoadedAt.getTime() > 300000) {
      await loadConfigFromDb();
    }

    // Get comprehensive usage stats
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      orgCount,
      userCount,
      projectCount,
      docCount,
      taskCount,
      rfiCount,
      submittalCount,
      activeUsersToday,
      activeUsersWeek,
      recentActivities,
      storageUsed
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.project.count(),
      prisma.document.count(),
      prisma.task.count(),
      prisma.rFI.count(),
      prisma.submittal.count(),
      prisma.user.count({ where: { lastLogin: { gte: oneDayAgo } } }),
      prisma.user.count({ where: { lastLogin: { gte: oneWeekAgo } } }),
      prisma.activityLog.count({ where: { createdAt: { gte: oneDayAgo } } }),
      prisma.document.aggregate({ _sum: { fileSize: true } })
    ]);

    return NextResponse.json({
      config: platformConfig,
      usage: {
        organizations: orgCount,
        users: userCount,
        projects: projectCount,
        documents: docCount,
        tasks: taskCount,
        rfis: rfiCount,
        submittals: submittalCount,
        activeUsersToday,
        activeUsersWeek,
        recentActivities,
        storageUsed: Number(storageUsed._sum?.fileSize || 0)
      },
      version: "2.1.0",
      buildDate: "2026-01-20",
      environment: process.env.NODE_ENV || "development",
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching platform config:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updates = await request.json();
    const previousConfig = { ...platformConfig };

    // Deep merge updates
    platformConfig = deepMerge(platformConfig, updates);

    // Persist config to database
    await prisma.activityLog.create({
      data: {
        action: "platform_config_stored",
        entityType: "SYSTEM",
        details: JSON.stringify(platformConfig),
        userId: session.user.id
      }
    });

    // Log the changes
    await prisma.activityLog.create({
      data: {
        action: "platform_config_updated",
        entityType: "SYSTEM",
        details: JSON.stringify({
          changes: updates,
          updatedBy: session.user.email,
          timestamp: new Date().toISOString()
        }),
        userId: session.user.id
      }
    });

    // Broadcast maintenance mode changes
    if (updates.maintenanceMode !== undefined && updates.maintenanceMode !== previousConfig.maintenanceMode) {
      broadcastToAll({
        type: "service_status_changed",
        data: {
          service: "platform",
          status: updates.maintenanceMode ? "maintenance" : "operational",
          message: updates.maintenanceMessage || platformConfig.maintenanceMessage,
          timestamp: new Date().toISOString()
        }
      });
    }

    return NextResponse.json({ success: true, config: platformConfig });
  } catch (error) {
    console.error("Error updating platform config:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST for specific actions like reset, export, import
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, data } = await request.json();

    switch (action) {
      case "reset":
        platformConfig = { ...DEFAULT_CONFIG };
        await prisma.activityLog.create({
          data: {
            action: "platform_config_reset",
            entityType: "SYSTEM",
            details: "Configuration reset to defaults",
            userId: session.user.id
          }
        });
        return NextResponse.json({ success: true, config: platformConfig });

      case "export":
        return NextResponse.json({
          config: platformConfig,
          exportedAt: new Date().toISOString(),
          exportedBy: session.user.email
        });

      case "import":
        if (!data) {
          return NextResponse.json({ error: "No configuration data provided" }, { status: 400 });
        }
        platformConfig = deepMerge(DEFAULT_CONFIG, data);
        await prisma.activityLog.create({
          data: {
            action: "platform_config_imported",
            entityType: "SYSTEM",
            details: JSON.stringify({ importedBy: session.user.email }),
            userId: session.user.id
          }
        });
        return NextResponse.json({ success: true, config: platformConfig });

      case "validate":
        // Validate config structure
        const isValid = validateConfig(data || platformConfig);
        return NextResponse.json({ valid: isValid.valid, errors: isValid.errors });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in platform config action:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function validateConfig(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.maxProjectsPerOrg && (config.maxProjectsPerOrg < 1 || config.maxProjectsPerOrg > 10000)) {
    errors.push("maxProjectsPerOrg must be between 1 and 10000");
  }
  if (config.maxUsersPerOrg && (config.maxUsersPerOrg < 1 || config.maxUsersPerOrg > 10000)) {
    errors.push("maxUsersPerOrg must be between 1 and 10000");
  }
  if (config.security?.passwordMinLength && config.security.passwordMinLength < 6) {
    errors.push("passwordMinLength must be at least 6");
  }
  if (config.security?.sessionTimeout && config.security.sessionTimeout < 300) {
    errors.push("sessionTimeout must be at least 300 seconds");
  }

  return { valid: errors.length === 0, errors };
}
