import { MortgagePlan } from '@/types';
import { CurrencyCode, getCurrencySymbol } from '@/lib/currency';

/**
 * Get the display name for a mortgage plan
 * Returns the custom name if provided, otherwise returns the default format
 */
export function getPlanDisplayName(
  plan: MortgagePlan,
  currency: CurrencyCode
): string {
  if (plan.name && plan.name.trim()) {
    return plan.name;
  }

  const symbol = getCurrencySymbol(currency);
  return `${symbol}${plan.amount.toLocaleString()} (${plan.takenDate})`;
}

/**
 * Parse DD/MM/YYYY date string and convert to month number (absolute index)
 */
export function parseDateToMonthIndex(dateStr: string): number {
  if (!dateStr) return 0;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts.map(Number);
    // Return month index + day fraction (day / 100)
    // e.g., 15/01/2024 -> (2024-2000)*12 + 1 - 1 + 0.15 = 288.15
    return (year - 2000) * 12 + month - 1 + (day / 100);
  }
  return 0;
}

/**
 * Get plan duration information
 */
export function getPlanDurationInfo(plan: MortgagePlan): { totalMonths: number, remainingMonths: number } {
  const startMonthIdx = parseDateToMonthIndex(plan.firstPaymentDate);
  const endMonthIdx = parseDateToMonthIndex(plan.lastPaymentDate);

  const totalMonths = Math.max(0, endMonthIdx - startMonthIdx + 1);

  // Calculate remaining months from current date
  const now = new Date();
  const currentMonthIdx = (now.getFullYear() - 2000) * 12 + now.getMonth();

  // If plan hasn't started, remaining is total
  if (currentMonthIdx < startMonthIdx) {
    return { totalMonths, remainingMonths: Math.floor(totalMonths) };
  }

  // If plan ended, remaining is 0
  if (currentMonthIdx > endMonthIdx) {
    return { totalMonths, remainingMonths: 0 };
  }

  const currentDay = now.getDate();
  const paymentDay = parseInt(plan.firstPaymentDate.split('/')[0], 10) || 1;
  if (currentDay < paymentDay) {
    // Payment not made yet, so this month is still remaining
    return { totalMonths, remainingMonths: Math.floor(totalMonths + 1) };
  }

  const remainingMonths = Math.max(0, endMonthIdx - currentMonthIdx);

  return { totalMonths, remainingMonths: Math.floor(remainingMonths) };
}

