import { useMemo } from 'react';
import { MortgagePlan, ExtraPayment, AmortizationRow, RateChange } from '@/types';
import { parseDateToMonthIndex } from '@/lib/planUtils';

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
    // MM/YYYY
    const [month, year] = parts.map(Number);
    return (year - 2000) * 12 + month - 1;
  }
  return 0;
}

/**
 * Convert month number to MM/YYYY format
 */
function formatMonth(monthNum: number): string {
  const year = 2000 + Math.floor(monthNum / 12);
  const month = (monthNum % 12) + 1;
  return `${month.toString().padStart(2, '0')}/${year}`;
}

export function useMortgage(
  plans: MortgagePlan[],
  extraPayments: ExtraPayment[],
  rateChanges: RateChange[] = []
): AmortizationRow[] {
  return useMemo(() => {
    if (plans.length === 0) {
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
    for (const plan of plans) {
      const monthlyRate = plan.interestRate / 100 / 12;

      const startMonthIdx = parseDateToMonthIndex(plan.firstPaymentDate);
      const endMonthIdx = parseDateToMonthIndex(plan.lastPaymentDate);

      // Calculate term in months (inclusive)
      // Example: 01/01/2024 to 01/01/2024 is 1 payment? Usually mortgage is monthly.
      // If first payment is Jan 2024 and last is Dec 2024, that's 12 payments.
      // (Dec - Jan) + 1 = 11 + 1 = 12.
      const termMonths = Math.max(1, endMonthIdx - startMonthIdx + 1);

      const monthlyPayment = calculatePMT(plan.amount, monthlyRate, termMonths);

      planData.set(plan.id, {
        plan,
        balance: plan.amount,
        monthlyPayment,
        monthlyRate,
        currentMonth: startMonthIdx,
        originalTermMonths: termMonths,
        remainingPayments: termMonths,
      });
    }

    // Get all unique months from plans, extra payments, and rate changes
    const allMonths = new Set<number>();
    plans.forEach(plan => {
      const startMonth = parseDateToMonthIndex(plan.firstPaymentDate);
      const endMonth = parseDateToMonthIndex(plan.lastPaymentDate);
      for (let i = startMonth; i <= endMonth; i++) {
        allMonths.add(i);
      }
    });
    extraPayments.forEach(ep => {
      allMonths.add(parseMonth(ep.month));
    });
    rateChanges.forEach(rc => {
      allMonths.add(parseMonth(rc.month));
    });

    const sortedMonths = Array.from(allMonths).sort((a, b) => a - b);

    // Process each month
    for (const monthNum of sortedMonths) {
      const monthStr = formatMonth(monthNum);

      // Process each active plan
      for (const [planId, data] of planData.entries()) {
        // Skip if plan hasn't started yet
        if (monthNum < parseDateToMonthIndex(data.plan.firstPaymentDate)) {
          continue;
        }

        // Skip if plan has ended (no remaining payments)
        if (data.remainingPayments <= 0) {
          continue;
        }

        const startingBalance = data.balance;
        let monthlyRate = data.monthlyRate;
        let monthlyPayment = data.monthlyPayment;
        let extraPayment = 0;
        let recalculatePayment = false;

        // Check for rate changes in this month (must be applied BEFORE calculating interest)
        const monthRateChanges = rateChanges.filter(
          rc => rc.planId === planId && parseMonth(rc.month) === monthNum
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
          if (startingBalance > 0 && data.remainingPayments > 0) {
            monthlyPayment = calculatePMT(startingBalance, monthlyRate, data.remainingPayments);
            data.monthlyPayment = monthlyPayment;
          }
        }

        // Check for extra payments in this month
        const monthExtraPayments = extraPayments.filter(
          ep => ep.planId === planId && parseMonth(ep.month) === monthNum
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
        data.remainingPayments -= 1;

        // Calculate total payment made this month
        // If we adjusted the principal for final payment, show actual payment (principal + interest)
        // Otherwise show scheduled payment + extra payments
        const totalPayment = adjustedPayment
          ? principal + interest  // Actual payment when adjusted
          : monthlyPayment + extraPayment; // Scheduled payment + extra

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
      if (monthA !== monthB) {
        return monthA - monthB;
      }
      const planA = planData.get(a.planId)?.plan;
      const planB = planData.get(b.planId)?.plan;
      if (!planA || !planB) return 0;
      return parseDateToMonthIndex(planA.firstPaymentDate) - parseDateToMonthIndex(planB.firstPaymentDate);
    });

    return rows;
  }, [plans, extraPayments, rateChanges]);
}
