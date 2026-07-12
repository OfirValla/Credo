import { Plan, ExtraPayment, AmortizationRow, RateChange, RowTag, GracePeriod } from '@/types';
import { parseDateToMonthIndex } from '@/lib/planUtils';
import { formatCurrency, CurrencyCode } from '@/lib/currency';
import { TFunction } from 'i18next';

// --- Types ---

export interface PlanState {
    plan: Plan;
    balance: number;
    monthlyPayment: number;
    monthlyRate: number;
    currentMonth: number;
    originalTermMonths: number;
    remainingPayments: number;
    lastInterestMonth: number;
    needsPaymentRecalc: boolean;
    lastAppliedCPI: number | null;
}

export interface CalculationContext {
    plans: Plan[];
    extraPayments: ExtraPayment[];
    rateChanges: RateChange[];
    gracePeriods: GracePeriod[];
    cpiData: any; // Type based on your CPI service
    currency: CurrencyCode;
    t?: TFunction;
}

// --- Helper Functions ---

/**
 * PMT Formula: P * [r(1+r)^n] / [(1+r)^n - 1]
 * Supports FV (Future Value / Balloon Amount)
 * PMT = (P * (1+r)^n - FV) * r / ((1+r)^n - 1)
 */
export function calculatePMT(principal: number, monthlyRate: number, numPayments: number, fv: number = 0): number {
    if (monthlyRate === 0) return (principal - fv) / numPayments;
    const factor = Math.pow(1 + monthlyRate, numPayments);
    return (principal * factor - fv) * monthlyRate / (factor - 1);
}

function daysInMonth(year: number, monthZeroBased: number): number {
    return new Date(year, monthZeroBased + 1, 0).getDate();
}

// Payment day, clamped to the month's length (a day-31 plan pays on 28/02)
function monthNumToDay(monthNum: number): { year: number; monthZeroBased: number; day: number } {
    const year = 2000 + Math.floor(monthNum / 12);
    const monthZeroBased = Math.floor(monthNum) % 12;
    const rawDay = Math.round((monthNum % 1) * 100) || 1;
    return { year, monthZeroBased, day: Math.min(rawDay, daysInMonth(year, monthZeroBased)) };
}

export function formatMonth(monthNum: number): string {
    const { year, monthZeroBased, day } = monthNumToDay(monthNum);
    return `${day.toString().padStart(2, '0')}/${(monthZeroBased + 1).toString().padStart(2, '0')}/${year}`;
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
function initializePlanStates(plans: Plan[]): Map<string, PlanState> {
    const planData = new Map<string, PlanState>();

    for (const plan of plans) {
        const monthlyRate = plan.interestRate / 100 / 12;
        const takenMonthIdx = parseDateToMonthIndex(plan.takenDate);
        const startPaymentMonthIdx = parseDateToMonthIndex(plan.firstPaymentDate);
        const endMonthIdx = parseDateToMonthIndex(plan.lastPaymentDate);

        // Calculate term in months
        const termMonths = Math.max(1, Math.floor(endMonthIdx) - Math.floor(startPaymentMonthIdx) + 1);
        const monthlyPayment = calculatePMT(plan.amount, monthlyRate, termMonths, plan.balloonValue || 0);

        planData.set(plan.id, {
            plan,
            balance: plan.amount,
            monthlyPayment,
            monthlyRate,
            currentMonth: takenMonthIdx,
            originalTermMonths: termMonths,
            remainingPayments: termMonths,
            lastInterestMonth: takenMonthIdx,
            needsPaymentRecalc: false,
            lastAppliedCPI: null,
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

    // Month indices are floats (month + day/100); normalize to 2 decimals so
    // near-equal values from different arithmetic paths collapse to one key
    const addMonth = (monthNum: number) => allMonths.add(Math.round(monthNum * 100) / 100);

    // 1. Plan Start and Payment Ranges
    plans.forEach(plan => {
        const startMonth = parseDateToMonthIndex(plan.takenDate);
        const firstPaymentMonth = parseDateToMonthIndex(plan.firstPaymentDate);
        const endMonth = parseDateToMonthIndex(plan.lastPaymentDate);
        const paymentDayFraction = firstPaymentMonth % 1;

        addMonth(startMonth);

        // Add payment stream
        for (let i = Math.floor(firstPaymentMonth); i <= Math.floor(endMonth); i++) {
            addMonth(i + paymentDayFraction);
        }

        // Add gap between taken and first payment
        for (let i = Math.floor(startMonth); i < Math.floor(firstPaymentMonth); i++) {
            if (i > Math.floor(startMonth)) addMonth(i + paymentDayFraction);
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
            addMonth(dayFraction > 0.001 ? index : Math.floor(index) + paymentDayFraction);
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
            addMonth(i + dayFraction);
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
    const noChange = { linkageDiff: 0, newBalance: state.balance, newPayment: state.monthlyPayment };

    if (!state.plan.linkedToCPI) return noChange;

    // Israeli CPI is published mid-month for the previous month: payments after
    // the 15th use the freshest reading, earlier payments lag one more month
    const paymentDay = Math.round((monthNum % 1) * 100);
    const referenceMonthIdx = paymentDay > 15 ? Math.floor(monthNum) - 1 : Math.floor(monthNum) - 2;

    const referenceCPI = getCPI(cpiData, referenceMonthIdx);

    // Missing reading: keep the last applied CPI so the gap is caught up
    // (not skipped) once the next reading is available
    if (!referenceCPI) return noChange;

    // First available reading establishes the linkage base — no adjustment yet
    if (state.lastAppliedCPI === null) {
        state.lastAppliedCPI = referenceCPI;
        return noChange;
    }

    const inflationFactor = referenceCPI / state.lastAppliedCPI;
    state.lastAppliedCPI = referenceCPI;
    const linkageDiff = state.balance * (inflationFactor - 1);

    return {
        linkageDiff,
        newBalance: state.balance + linkageDiff,
        newPayment: state.monthlyPayment * inflationFactor
    };
}

/**
 * Interest accrued since the previous row.
 * Whole-month periods charge the nominal monthly rate (Spitzer convention,
 * independent of calendar days) so the schedule amortizes exactly to zero.
 * Partial stub periods (e.g. between the taken date and the first aligned row)
 * accrue daily at monthlyRate / 30.
 */
function calculateInterest(
    state: PlanState,
    monthNum: number
): number {
    const monthsDiff = monthNum - state.lastInterestMonth;
    const wholeMonths = Math.round(monthsDiff);

    // A day is 0.01 in month-index units, so 0.005 tolerance = same day-of-month
    if (wholeMonths >= 1 && Math.abs(monthsDiff - wholeMonths) < 0.005) {
        return state.balance * state.monthlyRate * wholeMonths;
    }

    const dailyRate = state.monthlyRate / 30;
    const diffTime = monthNumToDate(monthNum).getTime() - monthNumToDate(state.lastInterestMonth).getTime();
    const daysInPeriod = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));

    return state.balance * dailyRate * daysInPeriod;
}

function monthNumToDate(monthNum: number): Date {
    const { year, monthZeroBased: month, day } = monthNumToDay(monthNum);
    return new Date(year, month, day);
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
    currency: CurrencyCode,
    t?: TFunction
): RowTag[] {
    const tags: RowTag[] = [];

    // Fallback if t is not provided (should not happen if hooked up correctly)
    const _t = t || ((key: string, options?: any) => {
        // Very basic fallback
        if (key === 'tags.grace.interestOnly') return 'Grace: Interest Only';
        if (key === 'tags.grace.capitalized') return 'Grace: Capitalized';
        if (key === 'tags.grace.taken') return 'Taken (Interest Accrual)';
        if (key === 'tags.extra') return `Extra: ${options?.amount}`;
        if (key === 'tags.rate') return `Rate: ${options?.rate}%`;
        if (key === 'tags.cpi') return `CPI: ${options?.amount}`;
        return key;
    });

    if (isGracePeriod) {
        if (activeGracePeriod) {
            tags.push({
                type: 'grace-period',
                label: activeGracePeriod.type === 'interestOnly' ? _t('tags.grace.interestOnly') : _t('tags.grace.capitalized'),
                color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
            });
        } else {
            tags.push({
                type: 'grace-period',
                label: state.plan.gracePeriodType === 'interestOnly' ? _t('tags.grace.interestOnly') : _t('tags.grace.taken'),
                color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
            });
        }
    }

    if (extraPayment > 0) {
        tags.push({
            type: 'extra-payment',
            label: _t('tags.extra', { amount: formatCurrency(extraPayment, currency) }),
        });
    }

    if (rateChange) {
        tags.push({
            type: 'rate-change',
            label: _t('tags.rate', { rate: rateChange.newAnnualRate }),
            color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
        });
    }

    if (linkageAmount !== 0) {
        tags.push({
            type: 'rate-change',
            label: _t('tags.cpi', { amount: `${linkageAmount > 0 ? '+' : ''}${formatCurrency(linkageAmount, currency)}` }),
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

    // 2b. Skip if fully repaid early (e.g. reduce-term extra payments)
    if (state.balance <= 0.01) return null;

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
            state.monthlyPayment = calculatePMT(state.balance, state.monthlyRate, state.remainingPayments, state.plan.balloonValue || 0);
        }
    }

    // 6. Calculate Interest
    const interest = calculateInterest(state, monthNum);

    // 7. Determine Payment
    let currentPayment = state.monthlyPayment;

    if (isGracePeriod) {
        const type = activeGracePeriod?.type || state.plan.gracePeriodType;
        currentPayment = (type === 'interestOnly') ? interest : 0;
        // Balance/term changed during grace — payment must be re-derived afterwards
        state.needsPaymentRecalc = true;
    } else if ((isFirstPaymentMonth || state.needsPaymentRecalc) && state.balance > 0) {
        // Recalculate the payment over the months left until the plan's end date:
        // after startup interest accumulation, and after any grace period
        // (capitalized interest / frozen payment count), keeping the end date fixed
        const endIdx = parseDateToMonthIndex(state.plan.lastPaymentDate);
        const paymentsLeft = Math.max(1, Math.floor(endIdx) - Math.floor(monthNum) + 1);
        state.remainingPayments = paymentsLeft;
        state.monthlyPayment = calculatePMT(state.balance, state.monthlyRate, paymentsLeft, state.plan.balloonValue || 0);
        currentPayment = state.monthlyPayment;
        state.needsPaymentRecalc = false;
    }

    // 8. Extra Payments
    const extra = calculateExtraPayment(ctx, state.plan.id, monthNum);
    const extraPaymentAmount = extra.amount;

    // 9. Amortization Math
    let principal = currentPayment - interest + extraPaymentAmount;
    let adjustedPayment = false;

    // Cannot pay more than balance (though balloon should remain).
    // When clamped (early payoff), the actual payment is smaller than the
    // scheduled one — report only what was really paid.
    if (principal > state.balance) {
        principal = state.balance;
        adjustedPayment = true;
    }

    // For balloon, we don't want to pay off the balloon part with normal payment.
    // However, the PMT is calculated to leave exactly Balloon amount.
    // So 'principal' calculated here should naturally reduce balance towards Balloon.

    let endingBalance = Math.max(0, state.balance - principal);

    // Handle small remainders (snap to 0 or balloon)
    // If we are at the very last payment, we might need to snap to balloon value?
    // Actually, remainingPayments reaches 0.

    // Logic: if endingBalance is close to 0 (and no balloon) snap to 0. (line 372 original)
    // If we have balloon, we shouldn't snap to 0 unless balloon is 0.

    const balloonTarget = state.plan.balloonValue || 0;

    // If this is the last payment and we are close to balloon target?
    // Not explicitly handled, but math should work.
    // However, floating point errors might occur.
    if (endingBalance > balloonTarget && endingBalance < balloonTarget + 0.01) {
        // Snap to balloon?
        // Actually, if we overpaid slightly, principal changes.
        // Let's keep the snap to 0 logic only if balloon is 0 for safety.
        if (balloonTarget === 0 && endingBalance < 0.01) {
            principal += endingBalance;
            endingBalance = 0;
            adjustedPayment = true;
        }
    }

    // Recalculate future payments if requested (e.g. Reduce Payment extra payment type)
    if (extra.recalculate && endingBalance > balloonTarget) {
        state.monthlyPayment = calculatePMT(endingBalance, state.monthlyRate, state.remainingPayments - 1, balloonTarget);
    }

    // Update State for next iteration
    const startingBalance = state.balance;
    state.balance = endingBalance;
    if (!isGracePeriod) state.remainingPayments -= 1;
    if (endingBalance <= balloonTarget + 0.01 && state.remainingPayments <= 0) {
        // We are done.
        state.remainingPayments = 0;
    }

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
        ctx.currency,
        ctx.t
    );

    // Update last interest accrual point
    state.lastInterestMonth = monthNum;

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

export function calculateAmortizationSchedule(
    plans: Plan[],
    extraPayments: ExtraPayment[],
    rateChanges: RateChange[],
    gracePeriods: GracePeriod[],
    currency: CurrencyCode,
    cpiData: any,
    t?: TFunction
): AmortizationRow[] {
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
        currency,
        t
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
}
