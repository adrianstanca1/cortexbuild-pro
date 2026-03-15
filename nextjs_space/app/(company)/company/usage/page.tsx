import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { CompanyUsageClient } from "./usage-client";
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
  billingCycle: "monthly" | "annual";
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
          },
        },
      },
    });

    if (!organizationData) {
      throw new Error("Organization not found");
    }

    // Fetch usage metrics
    // TODO: Implement apiCall tracking when the model is available
    const apiCalls = 0; // await prisma.apiCall.count({...}) - model not yet available

    const storageUsed = await prisma.document.aggregate({
      where: {
        project: { organizationId: user.organizationId },
      },
      _sum: {
        fileSize: true,
      },
    });

    // Fetch historical usage data
    // TODO: Implement when apiCall tracking is available
    const historicalData: any[] = []; // await prisma.apiCall.groupBy({...}) - model not yet available

    // Parse entitlements
    const entitlements = parseEntitlements(
      organizationData.entitlements || "{}",
    );

    // Format historical data for the chart
    const historicalDataFormatted = historicalData.map((item) => ({
      date: item.createdAt.toISOString().split("T")[0],
      apiCalls: item._count.id,
      storageUsedMB: 0, // Would need to join with storage data for accurate historical
    }));

    // Construct usage data
    const usageData: UsageData = {
      metrics: {
        apiCalls: apiCalls,
        storageUsedMB:
          Math.round(
            (Number(storageUsed._sum.fileSize || 0) / (1024 * 1024)) * 100,
          ) / 100,
        activeUsers: organizationData._count.users,
        projectsCreated: organizationData._count.projects,
      },
      subscription: {
        name: (entitlements as any).planName || "Free",
        maxApiCalls: (entitlements as any).limits?.maxApiCalls || 1000,
        maxStorageMB: (entitlements as any).limits?.maxStorageMB || 1024,
        maxUsers: (entitlements as any).limits?.maxUsers || 5,
        maxProjects: (entitlements as any).limits?.maxProjects || 10,
        price: (entitlements as any).price || 0,
        billingCycle:
          ((entitlements as any).billingCycle as "monthly" | "annual") ||
          "monthly",
      },
      billing: {
        currentCycleStart: new Date(),
        currentCycleEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paymentMethod: "None",
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      historicalUsage: historicalDataFormatted,
    };

    return <CompanyUsageClient usageData={usageData} />;
  } catch (error) {
    console.error("Error fetching usage data:", error);
    // Return error state to client
    return (
      <CompanyUsageClient error="Failed to load usage data. Please try again later." />
    );
  }
}
