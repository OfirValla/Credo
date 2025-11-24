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
    const [, month, year] = parts.map(Number);
    return (year - 2000) * 12 + month - 1;
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
    return { totalMonths, remainingMonths: totalMonths };
  }

  // If plan ended, remaining is 0
  if (currentMonthIdx > endMonthIdx) {
    return { totalMonths, remainingMonths: 0 };
  }

  const remainingMonths = Math.max(0, endMonthIdx - currentMonthIdx + 1); // Inclusive of current month? Usually yes if not paid yet.
  // Let's assume if we are in the month, we still have to pay it (or it's just being paid).

  return { totalMonths, remainingMonths };
}

