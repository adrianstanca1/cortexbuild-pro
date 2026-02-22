// Quota enforcement utilities
import { prisma } from '@/lib/db';
import { QuotaType } from '@prisma/client';

export async function checkQuota(
  organizationId: string,
  quotaType: QuotaType,
  requestedAmount: number = 1
): Promise<{ allowed: boolean; current: number; limit: number; available: number }> {
  const quota = await prisma.resourceQuota.findFirst({
    where: {
      organizationId,
      quotaType,
      isActive: true
    }
  });

  if (!quota) {
    return { allowed: true, current: 0, limit: Infinity, available: Infinity };
  }

  // Get current usage
  const latestUsage = await prisma.quotaUsageRecord.findFirst({
    where: { quotaId: quota.id },
    orderBy: { timestamp: 'desc' }
  });

  const currentUsage = latestUsage ? Number(latestUsage.currentValue) : 0;
  const limit = Number(quota.limitValue);
  const available = limit - currentUsage;

  return {
    allowed: currentUsage + requestedAmount <= limit,
    current: currentUsage,
    limit,
    available
  };
}

export async function incrementQuota(
  organizationId: string,
  quotaType: QuotaType,
  amount: number = 1
): Promise<void> {
  const quota = await prisma.resourceQuota.findFirst({
    where: {
      organizationId,
      quotaType,
      isActive: true
    }
  });

  if (!quota) return;

  const latestUsage = await prisma.quotaUsageRecord.findFirst({
    where: { quotaId: quota.id },
    orderBy: { timestamp: 'desc' }
  });

  const currentValue = latestUsage ? Number(latestUsage.currentValue) + amount : amount;
  
  const now = new Date();
  const periodStart = getPeriodStart(now, quota.period);
  const periodEnd = getPeriodEnd(periodStart, quota.period);

  await prisma.quotaUsageRecord.create({
    data: {
      quotaId: quota.id,
      currentValue: BigInt(currentValue),
      periodStart,
      periodEnd
    }
  });
}

export async function decrementQuota(
  organizationId: string,
  quotaType: QuotaType,
  amount: number = 1
): Promise<void> {
  await incrementQuota(organizationId, quotaType, -amount);
}

function getPeriodStart(date: Date, period: string): Date {
  const d = new Date(date);
  switch (period) {
    case 'DAILY':
      d.setHours(0, 0, 0, 0);
      return d;
    case 'MONTHLY':
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return d;
    case 'YEARLY':
      d.setMonth(0, 1);
      d.setHours(0, 0, 0, 0);
      return d;
    case 'TOTAL':
      return new Date(0);
    default:
      return d;
  }
}

function getPeriodEnd(start: Date, period: string): Date {
  const d = new Date(start);
  switch (period) {
    case 'DAILY':
      d.setDate(d.getDate() + 1);
      return d;
    case 'MONTHLY':
      d.setMonth(d.getMonth() + 1);
      return d;
    case 'YEARLY':
      d.setFullYear(d.getFullYear() + 1);
      return d;
    case 'TOTAL':
      return new Date('2100-01-01');
    default:
      return d;
  }
}

export async function getQuotaUsage(organizationId: string) {
  const quotas = await prisma.resourceQuota.findMany({
    where: { organizationId, isActive: true },
    include: {
      usage: {
        orderBy: { timestamp: 'desc' },
        take: 1
      }
    }
  });

  return quotas.map(quota => ({
    type: quota.quotaType,
    limit: Number(quota.limitValue),
    current: quota.usage[0] ? Number(quota.usage[0].currentValue) : 0,
    percentage: quota.usage[0] 
      ? (Number(quota.usage[0].currentValue) / Number(quota.limitValue)) * 100 
      : 0,
    warningThreshold: quota.warningThreshold * 100,
    period: quota.period
  }));
}
