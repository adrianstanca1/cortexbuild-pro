import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Global currency configuration - GBP for UK-based platform
export const CURRENCY = {
  code: 'GBP',
  symbol: '£',
  locale: 'en-GB'
} as const;

export function formatCurrency(amount: number, options?: { compact?: boolean }): string {
  if (options?.compact) {
    if (amount >= 1000000) {
      return `${CURRENCY.symbol}${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${CURRENCY.symbol}${(amount / 1000).toFixed(0)}K`;
    }
  }
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
