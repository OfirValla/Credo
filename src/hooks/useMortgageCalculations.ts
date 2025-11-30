import { useMemo } from 'react';
import { MortgagePlan, ExtraPayment, AmortizationRow, RateChange, RowTag, GracePeriod } from '@/types';
import { parseDateToMonthIndex } from '@/lib/planUtils';
import { formatCurrency, CurrencyCode } from '@/lib/currency';
import { useCPI } from '@/hooks/useCPI';

// --- Types ---

interface PlanState {
  plan: MortgagePlan;
  balance: number;
  monthlyPayment: number;
  monthlyRate: number;
  currentMonth: number;
  originalTermMonths: number;
  remainingPayments: number;
}

interface CalculationContext {
  plans: MortgagePlan[];
  extraPayments: ExtraPayment[];
  rateChanges: RateChange[];
  gracePeriods: GracePeriod[];
  cpiData: any; // Type based on your CPI service
  currency: CurrencyCode;
}

// --- Helper Functions ---

/**
 * PMT Formula: P * [r(1+r)^n] / [(1+r)^n - 1]
 */
function calculatePMT(principal: number, monthlyRate: number, numPayments: number): number {
  if (monthlyRate === 0) return principal / numPayments;
  const factor = Math.pow(1 + monthlyRate, numPayments);
  return principal * (monthlyRate * factor) / (factor - 1);
}

function formatMonth(monthNum: number): string {
  const year = 2000 + Math.floor(monthNum / 12);
  const month = (Math.floor(monthNum) % 12) + 1;
  const day = Math.round((monthNum % 1) * 100) || 1;
  return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
}

function getCPI(cpiData: any, monthNum: number): number | null {
  const year = 2000 + Math.floor(monthNum / 12);
  const month = (Math.floor(monthNum) % 12) + 1;
  const yearStr = year.toString();
  const monthStr = month.toString().padStart(2, '0');

  if (cpiData?.[yearStr]?.[monthStr]) return cpiData[yearStr][monthStr];
  if (cpiData?.[yearStr]?.[month.toString()]) return cpiData[yearStr][month.toString()];

  return null;
}

// --- Logic Generators ---

/**
 * Initializes the tracking state for all enabled plans
 */
function initializePlanStates(plans: MortgagePlan[]): Map<string, PlanState> {
  const planData = new Map<string, PlanState>();

  for (const plan of plans) {
    const monthlyRate = plan.interestRate / 100 / 12;
    const takenMonthIdx = parseDateToMonthIndex(plan.takenDate);
    const startPaymentMonthIdx = parseDateToMonthIndex(plan.firstPaymentDate);
    const endMonthIdx = parseDateToMonthIndex(plan.lastPaymentDate);

    // Calculate term in months
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
  return planData;
}

/**
 * Collects all relevant month indices (start dates, payments, extra payments, rate changes)
 * and returns them sorted.
 */
function collectRelevantMonths(ctx: CalculationContext, planPaymentDays: Map<string, number>): number[] {
  const allMonths = new Set<number>();
  const { plans, extraPayments, rateChanges, gracePeriods } = ctx;

  // 1. Plan Start and Payment Ranges
  plans.forEach(plan => {
    const startMonth = parseDateToMonthIndex(plan.takenDate);
    const firstPaymentMonth = parseDateToMonthIndex(plan.firstPaymentDate);
    const endMonth = parseDateToMonthIndex(plan.lastPaymentDate);
    const paymentDayFraction = firstPaymentMonth % 1;

    allMonths.add(startMonth);

    // Add payment stream
    for (let i = Math.floor(firstPaymentMonth); i <= Math.floor(endMonth); i++) {
      allMonths.add(i + paymentDayFraction);
    }

    // Add gap between taken and first payment
    for (let i = Math.floor(startMonth); i < Math.floor(firstPaymentMonth); i++) {
      if (i > Math.floor(startMonth)) allMonths.add(i + paymentDayFraction);
    }
  });

  // 2. Extra Payments & Rate Changes
  const addEventDates = (items: (ExtraPayment | RateChange)[]) => {
    items.forEach(item => {
      if (!plans.find(p => p.id === item.planId)) return;

      const paymentDayFraction = planPaymentDays.get(item.planId) || 0.01;
      const index = parseDateToMonthIndex(item.month);
      const dayFraction = index % 1;

      // Use specific day if provided, otherwise align to plan payment day
      allMonths.add(dayFraction > 0.001 ? index : Math.floor(index) + paymentDayFraction);
    });
  };

  addEventDates(extraPayments);
  addEventDates(rateChanges);

  // 3. Grace Periods
  gracePeriods.forEach(gp => {
    if (!plans.find(p => p.id === gp.planId)) return;
    const start = Math.floor(parseDateToMonthIndex(gp.startDate));
    const end = Math.floor(parseDateToMonthIndex(gp.endDate));
    const dayFraction = planPaymentDays.get(gp.planId) || 0.01;

    for (let i = start; i <= end; i++) {
      allMonths.add(i + dayFraction);
    }
  });

  return Array.from(allMonths).sort((a, b) => a - b);
}

// --- Calculation Steps ---

function calculateCPIAdjustment(
  state: PlanState,
  monthNum: number,
  cpiData: any
): { linkageDiff: number; newBalance: number; newPayment: number } {
  if (!state.plan.linkedToCPI) {
    return { linkageDiff: 0, newBalance: state.balance, newPayment: state.monthlyPayment };
  }

  const paymentDay = monthNum % 1;
  let prevMonthIdx = paymentDay > 15 ? Math.floor(monthNum) - 2 : Math.floor(monthNum) - 3;
  let currentMonthIdx = paymentDay > 15 ? Math.floor(monthNum) - 1 : Math.floor(monthNum) - 2;

  const currentCPI = getCPI(cpiData, currentMonthIdx);
  const prevCPI = getCPI(cpiData, prevMonthIdx);

  console.groupCollapsed(`CPI : ${formatMonth(monthNum)}`);
  console.log("Prev: ", formatMonth(prevMonthIdx), prevCPI);
  console.log("Current: ", formatMonth(currentMonthIdx), currentCPI);
  console.groupEnd();

  if (currentCPI && prevCPI && prevCPI !== 0) {
    const inflationFactor = currentCPI / prevCPI;
    const linkageDiff = state.balance * (inflationFactor - 1);

    return {
      linkageDiff,
      newBalance: state.balance + linkageDiff,
      newPayment: state.monthlyPayment * inflationFactor
    };
  }

  return { linkageDiff: 0, newBalance: state.balance, newPayment: state.monthlyPayment };
}

function calculateInterest(
  state: PlanState,
  monthNum: number,
  isGracePeriod: boolean,
  isFirstPaymentMonth: boolean
): number {
  let daysInPeriod = 30;

  // Handle precise day counting for startup or grace periods
  if (isGracePeriod || isFirstPaymentMonth) {
    const takenDate = parseDateToDate(state.plan.takenDate);
    const firstPaymentDate = parseDateToDate(state.plan.firstPaymentDate);
    const currentYear = 2000 + Math.floor(monthNum / 12);
    const currentMonth = Math.floor(monthNum) % 12;

    if (isGracePeriod) {
      // Logic: If month is taken month, start from taken date, else start 1st of month
      const isStartMonth = monthNum < parseDateToMonthIndex(state.plan.takenDate) + 0.1;
      const periodStart = isStartMonth
        ? takenDate
        : new Date(currentYear, currentMonth, 1);

      const periodEnd = new Date(currentYear, currentMonth + 1, 0); // Last day of month
      daysInPeriod = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (86400000)) + 1;
    } else if (isFirstPaymentMonth) {
      daysInPeriod = firstPaymentDate.getDate();
    }
  }

  const dailyRate = state.monthlyRate / 30;
  return state.balance * dailyRate * daysInPeriod;
}

function parseDateToDate(dateStr: string) {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
}

function calculateExtraPayment(
  ctx: CalculationContext,
  planId: string,
  monthNum: number
): { amount: number; recalculate: boolean } {
  let amount = 0;
  let recalculate = false;

  const relevantPayments = ctx.extraPayments.filter(ep =>
    ep.planId === planId &&
    Math.floor(parseDateToMonthIndex(ep.month)) === Math.floor(monthNum)
  );

  for (const ep of relevantPayments) {
    amount += ep.amount;
    if (ep.type === 'reducePayment') recalculate = true;
  }

  return { amount, recalculate };
}

function generateRowTags(
  state: PlanState,
  extraPayment: number,
  rateChange: RateChange | undefined,
  linkageAmount: number,
  activeGracePeriod: GracePeriod | undefined,
  isGracePeriod: boolean,
  currency: CurrencyCode
): RowTag[] {
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
        label: state.plan.gracePeriodType === 'interestOnly' ? 'Interest Only' : 'Taken (Interest Accrual)',
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

  if (rateChange) {
    tags.push({
      type: 'rate-change',
      label: `Rate: ${rateChange.newAnnualRate}%`,
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    });
  }

  if (linkageAmount !== 0) {
    tags.push({
      type: 'rate-change',
      label: `CPI: ${linkageAmount > 0 ? '+' : ''}${formatCurrency(linkageAmount, currency)}`,
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
    });
  }

  return tags;
}

// --- Main Processor ---

function processPlanMonth(
  ctx: CalculationContext,
  state: PlanState,
  monthNum: number
): AmortizationRow | null {
  const planStartIdx = parseDateToMonthIndex(state.plan.takenDate);
  const firstPaymentIdx = parseDateToMonthIndex(state.plan.firstPaymentDate);

  // 1. Skip if before start
  if (monthNum < planStartIdx - 0.0001) return null;

  // 2. Skip if finished
  if (state.remainingPayments <= 0 && monthNum >= firstPaymentIdx - 0.0001) return null;

  // 3. Apply CPI
  const cpiAdj = calculateCPIAdjustment(state, monthNum, ctx.cpiData);
  state.balance = cpiAdj.newBalance;
  state.monthlyPayment = cpiAdj.newPayment;

  // 4. Check Grace Period
  const activeGracePeriod = ctx.gracePeriods.find(gp =>
    gp.planId === state.plan.id &&
    monthNum >= parseDateToMonthIndex(gp.startDate) - 0.0001 &&
    monthNum <= parseDateToMonthIndex(gp.endDate) + 0.0001
  );

  const isInitialGracePeriod = monthNum < firstPaymentIdx - 0.0001;
  const isGracePeriod = isInitialGracePeriod || !!activeGracePeriod;
  const isFirstPaymentMonth = Math.abs(monthNum - firstPaymentIdx) < 0.0001;

  // 5. Apply Rate Changes
  const currentMonthInt = Math.floor(monthNum);
  const monthRateChanges = ctx.rateChanges.filter(rc =>
    rc.planId === state.plan.id &&
    Math.floor(parseDateToMonthIndex(rc.month)) === currentMonthInt
  ).sort((a, b) => a.id.localeCompare(b.id));

  const activeRateChange = monthRateChanges.length > 0 ? monthRateChanges[monthRateChanges.length - 1] : undefined;

  if (activeRateChange) {
    state.monthlyRate = activeRateChange.newAnnualRate / 100 / 12;
    if (state.balance > 0 && state.remainingPayments > 0 && !isGracePeriod) {
      state.monthlyPayment = calculatePMT(state.balance, state.monthlyRate, state.remainingPayments);
    }
  }

  // 6. Calculate Interest
  const interest = calculateInterest(state, monthNum, isGracePeriod, isFirstPaymentMonth);

  // 7. Determine Payment
  let currentPayment = state.monthlyPayment;

  if (isGracePeriod) {
    const type = activeGracePeriod?.type || state.plan.gracePeriodType;
    currentPayment = (type === 'interestOnly') ? interest : 0;
  } else if (isFirstPaymentMonth && state.balance > 0 && state.originalTermMonths > 0) {
    // Recalculate on first payment to ensure accuracy after startup interest accumulation
    state.monthlyPayment = calculatePMT(state.balance, state.monthlyRate, state.originalTermMonths);
    currentPayment = state.monthlyPayment;
  }

  // 8. Extra Payments
  const extra = calculateExtraPayment(ctx, state.plan.id, monthNum);
  let extraPaymentAmount = extra.amount;

  // 9. Amortization Math
  let principal = currentPayment - interest;
  principal += extraPaymentAmount;
  principal = Math.min(principal, state.balance); // Cannot pay more than balance

  let endingBalance = Math.max(0, state.balance - principal);
  let adjustedPayment = false;

  // Handle small remainders (snap to 0)
  if (endingBalance > 0 && endingBalance < 0.01) {
    principal += endingBalance;
    endingBalance = 0;
    adjustedPayment = true;
  }

  // Recalculate future payments if requested (e.g. Reduce Payment extra payment type)
  if (extra.recalculate && endingBalance > 0) {
    state.monthlyPayment = calculatePMT(endingBalance, state.monthlyRate, state.remainingPayments - 1);
  }

  // Update State for next iteration
  const startingBalance = state.balance;
  state.balance = endingBalance;
  if (!isGracePeriod) state.remainingPayments -= 1;
  if (endingBalance <= 0.01) state.remainingPayments = 0;

  const totalPayment = adjustedPayment
    ? principal + interest
    : currentPayment + extraPaymentAmount;

  // 10. Generate Tags & Row
  const tags = generateRowTags(
    state,
    extraPaymentAmount,
    activeRateChange,
    cpiAdj.linkageDiff,
    activeGracePeriod,
    isGracePeriod,
    ctx.currency
  );

  return {
    month: formatMonth(monthNum),
    planId: state.plan.id,
    startingBalance,
    monthlyRate: state.monthlyRate,
    monthlyPayment: totalPayment,
    principal,
    interest,
    endingBalance,
    tags,
    isGracePeriod,
    linkage: cpiAdj.linkageDiff
  };
}

// --- The Hook ---

export function useMortgageCalculations(
  plans: MortgagePlan[],
  extraPayments: ExtraPayment[],
  rateChanges: RateChange[] = [],
  gracePeriods: GracePeriod[] = [],
  currency: CurrencyCode = 'USD'
): AmortizationRow[] {
  const cpiData = useCPI();

  return useMemo(() => {
    // 0. Filter Enabled
    const enabledPlans = plans.filter(p => p.enabled);
    if (enabledPlans.length === 0) return [];

    const enabledPlansIds = enabledPlans.map(p => p.id);
    const enabledExtra = extraPayments.filter(e => e.enabled && enabledPlansIds.includes(e.planId));
    const enabledRates = rateChanges.filter(r => r.enabled && enabledPlansIds.includes(r.planId));
    const enabledGrace = gracePeriods.filter(g => g.enabled && enabledPlansIds.includes(g.planId));

    const ctx: CalculationContext = {
      plans: enabledPlans,
      extraPayments: enabledExtra,
      rateChanges: enabledRates,
      gracePeriods: enabledGrace,
      cpiData,
      currency
    };

    // 1. Initialize
    const planStates = initializePlanStates(enabledPlans);

    // 2. Pre-calculate Payment Days (for sorting/aligning months)
    const planPaymentDays = new Map<string, number>();
    enabledPlans.forEach(plan => {
      planPaymentDays.set(plan.id, Number((parseDateToMonthIndex(plan.firstPaymentDate) % 1).toFixed(2)));
    });

    // 3. Get Time Timeline
    const sortedMonths = collectRelevantMonths(ctx, planPaymentDays);

    // 4. Process Timeline
    const rows: AmortizationRow[] = [];

    for (const monthNum of sortedMonths) {
      for (const [_, state] of planStates) {
        const row = processPlanMonth(ctx, state, monthNum);
        if (row) rows.push(row);
      }
    }

    // 5. Final Sort (Month -> Plan Start Date)
    rows.sort((a, b) => {
      const monthA = parseDateToMonthIndex(a.month);
      const monthB = parseDateToMonthIndex(b.month);
      if (Math.abs(monthA - monthB) > 0.0001) return monthA - monthB;

      const planA = planStates.get(a.planId)?.plan;
      const planB = planStates.get(b.planId)?.plan;
      if (!planA || !planB) return 0;
      return parseDateToMonthIndex(planA.firstPaymentDate) - parseDateToMonthIndex(planB.firstPaymentDate);
    });

    return rows;

  }, [plans, extraPayments, rateChanges, gracePeriods, currency, cpiData]);
}