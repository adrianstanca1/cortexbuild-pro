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
        _count: {
          select: {
            users: true,
            projects: true,
          }
        },
        subscription: true,
      }
    });

    if (!organizationData) {
      throw new Error('Organization not found');
    }

    // Fetch usage metrics
    const apiCalls = await prisma.apiCall.count({
      where: {
        organizationId: user.organizationId,
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

    // Fetch historical usage data
    const historicalData = await prisma.apiCall.groupBy({
      by: ['createdAt'],
      where: {
        organizationId: user.organizationId
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Parse entitlements
    const entitlements = parseEntitlements(organizationData.entitlements);

    // Construct usage data
    const usageData: UsageData = {
      metrics: {
        apiCalls,
        storageUsedMB: Math.round((Number(storageUsed._sum.fileSize || 0) / (1024 * 1024)) * 100) / 100,
        activeUsers: organizationData._count.users,
        projectsCreated: organizationData._count.projects,
      },
      subscription: {
        name: organizationData.subscription?.planName || 'Free',
        maxApiCalls: entitlements.limits.maxApiCalls,
        maxStorageMB: entitlements.limits.storageMB,
        maxUsers: entitlements.limits.maxUsers,
        maxProjects: entitlements.limits.maxProjects,
        price: organizationData.subscription?.price || 0,
        billingCycle: organizationData.subscription?.billingCycle as 'monthly' | 'annual' || 'monthly',
      },
      billing: {
        currentCycleStart: organizationData.subscription?.currentCycleStart || new Date(),
        currentCycleEnd: organizationData.subscription?.currentCycleEnd || new Date(),
        paymentMethod: organizationData.subscription?.paymentMethod || 'None',
        nextPaymentDate: organizationData.subscription?.nextPaymentDate || new Date(),
      },
      historicalUsage: historicalData.map(item => ({
        date: item.createdAt.toISOString().split('T')[0],
        apiCalls: item._count.id,
        storageUsedMB: 0 // Would need to join with storage data for accurate historical
      })),
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
