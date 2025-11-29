import { useMemo } from 'react';
import { MortgagePlan, ExtraPayment, AmortizationRow, RateChange, RowTag, GracePeriod } from '@/types';
import { parseDateToMonthIndex } from '@/lib/planUtils';
import { formatCurrency, CurrencyCode } from '@/lib/currency';
import { CPIData, CPI_STORAGE_KEY, useCPI } from '@/lib/cpiService';
import { useLocalStorage } from './useLocalStorage';

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

export function useMortgageCalculations(
  plans: MortgagePlan[],
  extraPayments: ExtraPayment[],
  rateChanges: RateChange[] = [],
  gracePeriods: GracePeriod[] = [],
  currency: CurrencyCode = 'USD'
): AmortizationRow[] {
  const cpiData = useCPI();

  const getCPI = (monthNum: number): number | null => {
    const year = 2000 + Math.floor(monthNum / 12);
    const month = (Math.floor(monthNum) % 12) + 1;
    const yearStr = year.toString();
    const monthStr = month.toString().padStart(2, '0'); // Ensure 2 digits

    // Check if we have data for this specific month
    if (cpiData[yearStr] && cpiData[yearStr][monthStr]) {
      return cpiData[yearStr][monthStr];
    }

    // Try to find it with single digit if stored that way (though service stores as 2 digits)
    const monthStrSingle = month.toString();
    if (cpiData[yearStr] && cpiData[yearStr][monthStrSingle]) {
      return cpiData[yearStr][monthStrSingle];
    }

    return null;
  };

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
      const startBase = Math.floor(startMonth);
      for (let i = startBase; i < startPaymentBase; i++) {
        if (i > startBase) {
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
        allMonths.add(epMonthIndex);
      } else {
        // User entered MM/YYYY, align to payment day
        allMonths.add(epMonthBase + paymentDayFraction);
      }
    });

    rateChanges.forEach(rc => {
      // Skip rate changes that don't have an enabled plan
      if (!enabledPlans.find(plan => plan.id === rc.planId))
        return;

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

    // Add grace period months
    gracePeriods.forEach(gp => {
      if (!enabledPlans.find(plan => plan.id === gp.planId)) return;
      if (gp.enabled === false) return;

      const startMonth = parseMonth(gp.startDate);
      const endMonth = parseMonth(gp.endDate);
      const paymentDayFraction = planPaymentDays.get(gp.planId) || 0.01;

      const startBase = Math.floor(startMonth);
      const endBase = Math.floor(endMonth);

      for (let i = startBase; i <= endBase; i++) {
        allMonths.add(i + paymentDayFraction);
      }
    });

    const sortedMonths = Array.from(allMonths).sort((a, b) => a - b);

    // Process each month
    for (const monthNum of sortedMonths) {
      const monthStr = formatMonth(monthNum);

      // Process each active plan
      for (const [planId, data] of planData.entries()) {
        // Skip if plan hasn't started yet (based on taken date)
        if (monthNum < parseDateToMonthIndex(data.plan.takenDate) - 0.0001) {
          continue;
        }

        // Skip if plan has ended (no remaining payments) AND we are past the first payment date
        if (data.remainingPayments <= 0 && monthNum >= parseDateToMonthIndex(data.plan.firstPaymentDate) - 0.0001) {
          continue;
        }

        let startingBalance = data.balance;
        let monthlyRate = data.monthlyRate;
        let monthlyPayment = data.monthlyPayment;
        let extraPayment = 0;
        let recalculatePayment = false;
        let linkageAmount = 0;



        // Apply CPI Linkage if enabled
        if (data.plan.linkedToCPI) {
          // According to CBS, the index published on the 15th refers to the previous month.
          // So for a payment in month M, we use the index published in month M (which is for M-1)
          // and compare it to the index published in month M-1 (which is for M-2).
          const currentCPI = getCPI(Math.floor(monthNum) - 1);
          const prevCPI = getCPI(Math.floor(monthNum) - 2);

          if (currentCPI && prevCPI && prevCPI !== 0) {
            const inflationFactor = currentCPI / prevCPI;
            const linkageDiff = startingBalance * (inflationFactor - 1);

            linkageAmount = linkageDiff;
            startingBalance += linkageAmount;

            // Adjust monthly payment by the same factor to keep term constant
            monthlyPayment *= inflationFactor;
            data.monthlyPayment = monthlyPayment;
          }
        }

        // Check if we are in the initial grace period (before first payment date)
        const isInitialGracePeriod = monthNum < parseDateToMonthIndex(data.plan.firstPaymentDate) - 0.0001;

        // Check if we are in an additional grace period
        const activeGracePeriod = gracePeriods.find(gp =>
          gp.planId === planId &&
          gp.enabled !== false &&
          monthNum >= parseMonth(gp.startDate) - 0.0001 &&
          monthNum <= parseMonth(gp.endDate) + 0.0001
        );

        const isGracePeriod = isInitialGracePeriod || !!activeGracePeriod;
        const isFirstPaymentMonth = Math.abs(monthNum - parseDateToMonthIndex(data.plan.firstPaymentDate)) < 0.0001;

        // Check for rate changes in this month
        const currentMonthInt = Math.floor(monthNum);
        const monthRateChanges = rateChanges.filter(rc =>
          rc.planId === planId &&
          rc.enabled !== false &&
          Math.floor(parseMonth(rc.month)) === currentMonthInt
        );

        // Apply rate change if one exists
        if (monthRateChanges.length > 0) {
          monthRateChanges.sort((a, b) => a.id.localeCompare(b.id));
          const rateChange = monthRateChanges[monthRateChanges.length - 1];

          monthlyRate = rateChange.newAnnualRate / 100 / 12;
          data.monthlyRate = monthlyRate;

          if (startingBalance > 0 && data.remainingPayments > 0 && !isGracePeriod) {
            monthlyPayment = calculatePMT(startingBalance, monthlyRate, data.remainingPayments);
            data.monthlyPayment = monthlyPayment;
          }
        }

        // Calculate interest
        let daysInPeriod = 30;

        if (isGracePeriod || isFirstPaymentMonth) {
          const parseTakenDate = (dateStr: string) => {
            const [day, month, year] = dateStr.split('/').map(Number);
            return new Date(year, month - 1, day);
          };

          const takenDate = parseTakenDate(data.plan.takenDate);
          const firstPaymentDate = parseTakenDate(data.plan.firstPaymentDate);
          const currentMonthDate = new Date(2000 + Math.floor(monthNum / 12), Math.floor(monthNum) % 12, Math.round((monthNum % 1) * 100) || 1);

          if (isGracePeriod) {
            const periodStart = (monthNum < parseDateToMonthIndex(data.plan.takenDate) + 0.1)
              ? takenDate
              : new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 1);
            const periodEnd = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0);
            daysInPeriod = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          } else if (isFirstPaymentMonth) {
            daysInPeriod = firstPaymentDate.getDate();
          }
        }

        const dailyRate = monthlyRate / 30;
        const interest = startingBalance * dailyRate * daysInPeriod;

        // Determine Monthly Payment (Grace Period Logic)
        if (isGracePeriod) {
          if (data.plan.gracePeriodType === 'interestOnly') {
            monthlyPayment = interest;
          } else {
            monthlyPayment = 0;
          }

          if (activeGracePeriod) {
            if (activeGracePeriod.type === 'interestOnly') {
              monthlyPayment = interest;
            } else {
              monthlyPayment = 0;
            }
          }
        } else if (isFirstPaymentMonth) {
          if (startingBalance > 0 && data.originalTermMonths > 0) {
            monthlyPayment = calculatePMT(startingBalance, monthlyRate, data.originalTermMonths);
            data.monthlyPayment = monthlyPayment;
          }
        }

        // Check for extra payments
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

        let principal = monthlyPayment - interest;
        principal += extraPayment;
        principal = Math.min(principal, startingBalance);
        let endingBalance = startingBalance - principal;
        endingBalance = Math.max(0, endingBalance);

        let adjustedPayment = false;
        if (data.remainingPayments === 1 && endingBalance > 0 && endingBalance < 0.01) {
          principal = startingBalance;
          endingBalance = 0;
          adjustedPayment = true;
        } else if (endingBalance > 0 && endingBalance < 0.01) {
          principal += endingBalance;
          endingBalance = 0;
          adjustedPayment = true;
        }

        if (recalculatePayment && endingBalance > 0) {
          const newPayment = calculatePMT(endingBalance, monthlyRate, data.remainingPayments - 1);
          data.monthlyPayment = newPayment;
        }

        data.balance = endingBalance;

        if (!isGracePeriod) {
          data.remainingPayments -= 1;
        }

        const totalPayment = adjustedPayment
          ? principal + interest
          : monthlyPayment + extraPayment;

        // Prepare tags
        const tags: RowTag[] = [];
        if (isGracePeriod) {
          if (activeGracePeriod) {
            tags.push({
              type: 'grace-period',
              label: activeGracePeriod.type === 'interestOnly' ? 'Grace: Interest Only' : 'Grace: Capitalized',
              color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
            });
          } else {
            tags.push({
              type: 'grace-period',
              label: data.plan.gracePeriodType === 'interestOnly' ? 'Interest Only' : 'Taken (Interest Accrual)',
              color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
            });
          }
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

        if (linkageAmount !== 0) {
          const sign = linkageAmount > 0 ? '+' : '';
          tags.push({
            type: 'rate-change',
            label: `CPI: ${sign}${formatCurrency(linkageAmount, currency)}`,
            color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
          });
        }

        // Add row
        rows.push({
          month: monthStr,
          planId,
          startingBalance,
          monthlyRate,
          monthlyPayment: totalPayment,
          principal,
          interest,
          endingBalance,
          tags,
          isGracePeriod,
          linkage: linkageAmount
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
  }, [plans, extraPayments, rateChanges, gracePeriods, currency, cpiData]);
}
