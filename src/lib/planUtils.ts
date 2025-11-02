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
  return `${symbol}${plan.initialAmount.toLocaleString()} (${plan.startDate})`;
}

