import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { CompanyUsageClient } from './usage-client';
import { parseEntitlements } from "@/lib/entitlements";

// Define TypeScript interfaces for usage data
interface UsageMetrics {
  apiCalls: number;
  storageUsedMB: number;
  activeUsers: number;
  projectsCreated: number;
}

interface SubscriptionPlan {
  name: string;
  maxApiCalls: number;
  maxStorageMB: number;
  maxUsers: number;
  maxProjects: number;
  price: number;
  billingCycle: 'monthly' | 'annual';
}

interface BillingInfo {
  currentCycleStart: Date;
  currentCycleEnd: Date;
  paymentMethod: string;
  nextPaymentDate: Date;
}

interface UsageData {
  metrics: UsageMetrics;
  subscription: SubscriptionPlan;
  billing: BillingInfo;
  historicalUsage: Array<{
    date: string;
    apiCalls: number;
    storageUsedMB: number;
  }>;
}

/**
 * Renders the company usage page populated with computed usage, subscription, billing, and historical metrics.
 *
 * This server component:
 * - Ensures the user is authenticated and redirects to "/login" if not.
 * - Redirects to "/dashboard" when the authenticated user lacks an organizationId.
 * - Loads organization, activity log, and document data, computes usage metrics and subscription defaults, and passes the result to CompanyUsageClient.
 * - On failure, logs the error and renders CompanyUsageClient with an error message.
 *
 * @returns A React element that renders the company usage client with either the assembled `UsageData` or an error state.
 */
export default async function CompanyUsagePage() {
  // Server-side authentication
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const user = session.user as any;

  if (!user.organizationId) {
    redirect("/dashboard");
  }

  try {
    // Fetch organization data
    const organizationData = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      include: {
        users: true,
        projects: true,
      }
    });

    if (!organizationData) {
      throw new Error('Organization not found');
    }

    // Fetch usage metrics - using activity logs as proxy for API calls
    const activityLogs = await prisma.activityLog.count({
      where: {
        user: { organizationId: user.organizationId },
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)) // Last 30 days
        }
      }
    });

    const storageUsed = await prisma.document.aggregate({
      where: {
        project: { organizationId: user.organizationId }
      },
      _sum: {
        fileSize: true
      }
    });

    // Fetch historical usage data - using activity logs
    const historicalData = await prisma.activityLog.groupBy({
      by: ['createdAt'],
      where: {
        user: { organizationId: user.organizationId }
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Parse entitlements
    const entitlements = parseEntitlements(organizationData.entitlements || '{}');

    // Format historical data for the chart
    const historicalDataFormatted = historicalData.map(item => ({
      date: item.createdAt.toISOString().split('T')[0],
      apiCalls: item._count?.id || 0,
      storageUsedMB: 0 // Would need to join with storage data for accurate historical
    }));

    // Construct usage data
    const usageData: UsageData = {
      metrics: {
        apiCalls: activityLogs,
        storageUsedMB: Math.round((Number(storageUsed._sum.fileSize || 0) / (1024 * 1024)) * 100) / 100,
        activeUsers: organizationData.users.length,
        projectsCreated: organizationData.projects.length,
      },
      subscription: {
        name: 'Free', // Default to Free since we don't have a subscription model
        maxApiCalls: 1000, // Hardcoded as it's not in current entitlements schema
        maxStorageMB: (entitlements.limits?.storageGB || 10) * 1024,
        maxUsers: entitlements.limits?.maxUsers || 5,
        maxProjects: entitlements.limits?.maxProjects || 10,
        price: 0, // Default to 0 since we don't have a subscription model
        billingCycle: 'monthly',
      },
      billing: {
        currentCycleStart: new Date(),
        currentCycleEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        paymentMethod: 'None',
        nextPaymentDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      },
      historicalUsage: historicalDataFormatted,
    };

    return (
      <CompanyUsageClient usageData={usageData} />
    );

  } catch (error) {
    console.error('Error fetching usage data:', error);
    // Return error state to client
    return (
      <CompanyUsageClient error="Failed to load usage data. Please try again later." />
    );
  }
}