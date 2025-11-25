import { useMemo } from 'react';
import { MortgagePlan, ExtraPayment, AmortizationRow, RateChange, RowTag } from '@/types';
import { parseDateToMonthIndex } from '@/lib/planUtils';
import { formatCurrency } from '@/lib/currency';

/**
 * Calculate monthly payment using PMT formula
 * PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
 * where P = principal, r = monthly rate, n = number of payments
 */
function calculatePMT(principal: number, monthlyRate: number, numPayments: number): number {
  if (monthlyRate === 0) {
    return principal / numPayments;
  }
  const factor = Math.pow(1 + monthlyRate, numPayments);
  return principal * (monthlyRate * factor) / (factor - 1);
}



/**
 * Parse MM/YYYY or DD/MM/YYYY date string and convert to month number
 * Handles legacy MM/YYYY format for backward compatibility if needed
 */
function parseMonth(dateStr: string): number {
  if (!dateStr) return 0;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    // DD/MM/YYYY
    return parseDateToMonthIndex(dateStr);
  } else if (parts.length === 2) {
    // MM/YYYY - return integer month index (no day fraction)
    const [month, year] = parts.map(Number);
    return (year - 2000) * 12 + month - 1;
  }
  return 0;
}

/**
 * Convert month number (decimal) to DD/MM/YYYY format
 */
function formatMonth(monthNum: number): string {
  const year = 2000 + Math.floor(monthNum / 12);
  const month = (Math.floor(monthNum) % 12) + 1;
  const day = Math.round((monthNum % 1) * 100) || 1; // Default to 1st if no day fraction
  return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
}

import { CurrencyCode } from '@/lib/currency';

export function useMortgage(
  plans: MortgagePlan[],
  extraPayments: ExtraPayment[],
  rateChanges: RateChange[] = [],
  currency: CurrencyCode = 'USD'
): AmortizationRow[] {
  return useMemo(() => {
    if (plans.length === 0) {
      return [];
    }

    // Filter to only enabled plans (enabled defaults to true if not set)
    const enabledPlans = plans.filter(plan => plan.enabled !== false);

    if (enabledPlans.length === 0) {
      return [];
    }

    const rows: AmortizationRow[] = [];
    const planData = new Map<string, {
      plan: MortgagePlan;
      balance: number;
      monthlyPayment: number;
      monthlyRate: number;
      currentMonth: number;
      originalTermMonths: number;
      remainingPayments: number;
    }>();

    // Initialize plan data
    for (const plan of enabledPlans) {
      const monthlyRate = plan.interestRate / 100 / 12;

      const takenMonthIdx = parseDateToMonthIndex(plan.takenDate);
      const startPaymentMonthIdx = parseDateToMonthIndex(plan.firstPaymentDate);
      const endMonthIdx = parseDateToMonthIndex(plan.lastPaymentDate);

      // Calculate term in months (inclusive) based on PAYMENTS
      // Use Math.floor to compare months regardless of days
      const termMonths = Math.max(1, Math.floor(endMonthIdx) - Math.floor(startPaymentMonthIdx) + 1);

      const monthlyPayment = calculatePMT(plan.amount, monthlyRate, termMonths);

      planData.set(plan.id, {
        plan,
        balance: plan.amount,
        monthlyPayment,
        monthlyRate,
        currentMonth: takenMonthIdx,
        originalTermMonths: termMonths,
        remainingPayments: termMonths,
      });
    }

    // Get all unique months from plans, extra payments, and rate changes
    const allMonths = new Set<number>();

    // Create a map of planId to payment day fraction for easy lookup
    const planPaymentDays = new Map<string, number>();
    enabledPlans.forEach(plan => {
      const firstPaymentMonth = parseDateToMonthIndex(plan.firstPaymentDate);
      planPaymentDays.set(plan.id, firstPaymentMonth % 1);
    });

    enabledPlans.forEach(plan => {
      const startMonth = parseDateToMonthIndex(plan.takenDate);
      const firstPaymentMonth = parseDateToMonthIndex(plan.firstPaymentDate);
      const endMonth = parseDateToMonthIndex(plan.lastPaymentDate);

      // Add taken date
      allMonths.add(startMonth);

      // Add all payment dates
      // We iterate by whole months but keep the day fraction from firstPaymentMonth
      const paymentDayFraction = firstPaymentMonth % 1;
      const startPaymentBase = Math.floor(firstPaymentMonth);
      const endPaymentBase = Math.floor(endMonth);

      for (let i = startPaymentBase; i <= endPaymentBase; i++) {
        allMonths.add(i + paymentDayFraction);
      }

      // Also add months between taken and first payment if they are missing
      // (for grace period rows, aligned to payment day if possible, or just monthly steps from taken date?)
      // The user said "payments are exactly 1 month apart". 
      // Grace period rows usually align with the payment day too (e.g. interest accrues monthly on the 10th).
      // Let's align grace period rows to the payment day fraction, unless it's the taken date itself.
      const startBase = Math.floor(startMonth);
      for (let i = startBase; i < startPaymentBase; i++) {
        // If this month is the taken month, we already added startMonth (which has taken day).
        // If we want to show a row for "end of month 1 of grace period", it should probably be on the payment day.
        // Example: Taken 01/03, First Payment 10/04.
        // We have 01/03.
        // We want 10/03? (Interest accrual for March).
        // Yes, usually interest accrues monthly.
        if (i === startBase && (startMonth % 1) !== paymentDayFraction) {
          // If taken date is different day than payment day, we might want an intermediate row?
          // Or just jump to next month's payment day.
          // Let's add the payment day for this month too if it's after taken date.
          if ((i + paymentDayFraction) > startMonth) {
            allMonths.add(i + paymentDayFraction);
          }
        } else if (i > startBase) {
          allMonths.add(i + paymentDayFraction);
        }
      }
    });

    // For extra payments and rate changes, align to the payment day of their plan
    // Filter to only include enabled extra payments (enabled defaults to true if not set)
    const enabledExtraPayments = extraPayments.filter(ep => ep.enabled !== false);
    enabledExtraPayments.forEach(ep => {
      // Skip extra payments that don't have an enabled plan
      if (!enabledPlans.find(plan => plan.id === ep.planId))
        return;

      const paymentDayFraction = planPaymentDays.get(ep.planId) || 0.01;
      const epMonthIndex = parseMonth(ep.month);
      const epMonthBase = Math.floor(epMonthIndex);
      // If the extra payment was entered with DD/MM/YYYY, keep that day
      // Otherwise, use the plan's payment day
      const epDayFraction = epMonthIndex % 1;
      if (epDayFraction > 0.001) {
        // User specified a day, use it
        console.log("MonthIndex", epMonthIndex);
        allMonths.add(epMonthIndex);
      } else {
        // User entered MM/YYYY, align to payment day
        console.log("MonthBase", epMonthBase, paymentDayFraction);
        allMonths.add(epMonthBase + paymentDayFraction);
      }
    });

    rateChanges.forEach(rc => {
      const paymentDayFraction = planPaymentDays.get(rc.planId) || 0.01;
      const rcMonthIndex = parseMonth(rc.month);
      const rcMonthBase = Math.floor(rcMonthIndex);
      // If the rate change was entered with DD/MM/YYYY, keep that day
      // Otherwise, use the plan's payment day
      const rcDayFraction = rcMonthIndex % 1;
      if (rcDayFraction > 0.001) {
        // User specified a day, use it
        allMonths.add(rcMonthIndex);
      } else {
        // User entered MM/YYYY, align to payment day
        allMonths.add(rcMonthBase + paymentDayFraction);
      }
    });

    const sortedMonths = Array.from(allMonths).sort((a, b) => a - b);

    // Process each month
    for (const monthNum of sortedMonths) {
      const monthStr = formatMonth(monthNum);

      // Process each active plan
      for (const [planId, data] of planData.entries()) {
        // Skip if plan hasn't started yet (based on taken date)
        // Use a small epsilon for float comparison
        if (monthNum < parseDateToMonthIndex(data.plan.takenDate) - 0.0001) {
          continue;
        }

        // Skip if plan has ended (no remaining payments) AND we are past the first payment date
        // (We need to allow processing if we are in the grace period even if remainingPayments is full)
        if (data.remainingPayments <= 0 && monthNum >= parseDateToMonthIndex(data.plan.firstPaymentDate) - 0.0001) {
          continue;
        }

        const startingBalance = data.balance;
        let monthlyRate = data.monthlyRate;
        let monthlyPayment = data.monthlyPayment;
        let extraPayment = 0;
        let recalculatePayment = false;

        // Check if we are in the grace period (before first payment date)
        const isGracePeriod = monthNum < parseDateToMonthIndex(data.plan.firstPaymentDate) - 0.0001;
        const isFirstPaymentMonth = Math.abs(monthNum - parseDateToMonthIndex(data.plan.firstPaymentDate)) < 0.0001;

        if (isGracePeriod) {
          monthlyPayment = 0;
        } else if (isFirstPaymentMonth) {
          // Recalculate payment based on accumulated balance and original term
          // This ensures that the accumulated interest is paid off over the term
          if (startingBalance > 0 && data.originalTermMonths > 0) {
            monthlyPayment = calculatePMT(startingBalance, monthlyRate, data.originalTermMonths);
            data.monthlyPayment = monthlyPayment;
          }
        }

        // Check for rate changes in this month (must be applied BEFORE calculating interest)
        // Match by integer month (approximate) or exact date?
        // Rate changes usually happen on a specific date. 
        // If the rate change is "06/2024", parseMonth returns 1st of June (decimal .01).
        // Our rows might be on 10th of June (decimal .10).
        // We should apply the rate change if it's in the same month/year, or strictly before?
        // Let's assume rate changes apply to the payment of that month.
        const currentMonthInt = Math.floor(monthNum);
        const monthRateChanges = rateChanges.filter(
          rc => Math.floor(parseMonth(rc.month)) === currentMonthInt
        );

        // Apply rate change if one exists (use the latest one if multiple exist)
        if (monthRateChanges.length > 0) {
          // Sort by id to ensure consistent ordering, use the last one
          monthRateChanges.sort((a, b) => a.id.localeCompare(b.id));
          const rateChange = monthRateChanges[monthRateChanges.length - 1];

          // Update the monthly rate
          monthlyRate = rateChange.newAnnualRate / 100 / 12;
          data.monthlyRate = monthlyRate;

          // Recalculate monthly payment based on new rate, current balance, and remaining payments
          if (startingBalance > 0 && data.remainingPayments > 0 && !isGracePeriod) {
            monthlyPayment = calculatePMT(startingBalance, monthlyRate, data.remainingPayments);
            data.monthlyPayment = monthlyPayment;
          }
        }

        // Check for extra payments in this month (only enabled ones)
        const monthExtraPayments = extraPayments.filter(ep =>
          ep.planId === planId &&
          ep.enabled !== false &&
          Math.floor(parseMonth(ep.month)) === currentMonthInt
        );

        for (const ep of monthExtraPayments) {
          if (ep.type === 'reduceTerm') {
            extraPayment += ep.amount;
          } else if (ep.type === 'reducePayment') {
            extraPayment += ep.amount;
            recalculatePayment = true;
          }
        }

        // Calculate interest
        const interest = startingBalance * monthlyRate;

        // Calculate principal from regular payment
        let principal = monthlyPayment - interest;

        // Add extra payment to principal
        principal += extraPayment;

        // Ensure principal doesn't exceed the balance (can't pay more than owed)
        principal = Math.min(principal, startingBalance);

        // Calculate ending balance: starting balance minus principal paid
        let endingBalance = startingBalance - principal;

        // Ensure ending balance is never negative
        endingBalance = Math.max(0, endingBalance);

        // Adjust final payment if balance is very small (rounding errors)
        // This ensures the loan is fully paid off on the last payment
        let adjustedPayment = false;
        if (data.remainingPayments === 1 && endingBalance > 0 && endingBalance < 0.01) {
          // Last payment: adjust principal to pay off exactly
          principal = startingBalance;
          endingBalance = 0;
          adjustedPayment = true;
        } else if (endingBalance > 0 && endingBalance < 0.01) {
          // For any other payment, if balance is tiny due to rounding, pay it off
          principal += endingBalance;
          endingBalance = 0;
          adjustedPayment = true;
        }

        // If reducePayment type, recalculate payment for remaining term
        if (recalculatePayment && endingBalance > 0) {
          const newPayment = calculatePMT(endingBalance, monthlyRate, data.remainingPayments - 1);
          data.monthlyPayment = newPayment;
        }

        // Update plan data
        data.balance = endingBalance;

        if (!isGracePeriod) {
          data.remainingPayments -= 1;
        }

        // Calculate total payment made this month
        // If we adjusted the principal for final payment, show actual payment (principal + interest)
        // Otherwise show scheduled payment + extra payments
        const totalPayment = adjustedPayment
          ? principal + interest  // Actual payment when adjusted
          : monthlyPayment + extraPayment; // Scheduled payment + extra

        // Prepare tags
        const tags: RowTag[] = [];
        if (isGracePeriod) {
          tags.push({
            type: 'grace-period',
            label: 'Taken (Interest Accrual)',
            color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
          });
        }

        if (extraPayment > 0) {
          tags.push({
            type: 'extra-payment',
            label: `Extra: ${formatCurrency(extraPayment, currency)}`,
          });
        }

        if (monthRateChanges.length > 0) {
          const rateChange = monthRateChanges[monthRateChanges.length - 1];
          tags.push({
            type: 'rate-change',
            label: `Rate: ${rateChange.newAnnualRate}%`,
            color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
          });
        }

        // Add row
        rows.push({
          month: monthStr,
          planId,
          startingBalance,
          monthlyRate,
          monthlyPayment: totalPayment, // Show total payment including extra
          principal,
          interest,
          endingBalance,
          tags,
          isGracePeriod
        });

        // Stop if balance is paid off
        if (endingBalance <= 0.01) {
          data.remainingPayments = 0;
        }
      }
    }

    // Sort rows by month, then by plan start date
    rows.sort((a, b) => {
      const monthA = parseMonth(a.month);
      const monthB = parseMonth(b.month);
      if (Math.abs(monthA - monthB) > 0.0001) {
        return monthA - monthB;
      }
      const planA = planData.get(a.planId)?.plan;
      const planB = planData.get(b.planId)?.plan;
      if (!planA || !planB) return 0;
      return parseDateToMonthIndex(planA.firstPaymentDate) - parseDateToMonthIndex(planB.firstPaymentDate);
    });

    return rows;
  }, [plans, extraPayments, rateChanges, currency]);
}
