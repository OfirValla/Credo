import { useMemo } from 'react';
import { Calendar, DollarSign, TrendingUp, Sparkles, CalendarDays } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { usePlans } from '@/context/PlanProvider';
import { parseDateToMonthIndex, parseMonth } from '@/lib/planUtils';
import { useTranslation } from 'react-i18next';

/**
 * Get current month in MM/YYYY format
 */
/**
 * Get current date in DD/MM/YYYY format (internal use)
 */
function getCurrentDate(): string {
  const now = new Date();
  return now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Get display date string (e.g., "20 November 2025")
 */
/**
 * Get display date string (e.g., "20 November 2025")
 */
function getDisplayDate(locale: string = 'en-GB'): string {
  const now = new Date();
  return now.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Get next payment date (e.g., "10 Dec")
 * Assuming payments are due on the 10th of the next month
 */
/**
 * Get next payment date (e.g., "10 Dec")
 * If current date <= payment day, show this month's payment date
 * Else show next month's payment date
 */
function getNextPaymentDate(paymentDay: number = 10, locale: string = 'en-GB'): string {
  const now = new Date();
  const currentDay = now.getDate();

  // If we haven't passed the payment day yet (or it's today), show this month's payment
  if (currentDay <= paymentDay) {
    const paymentDateThisMonth = new Date(now);
    paymentDateThisMonth.setDate(paymentDay);
    return paymentDateThisMonth.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
    });
  }

  // Move to next month
  if (now.getMonth() === 11) {
    now.setFullYear(now.getFullYear() + 1);
    now.setMonth(0);
  } else {
    now.setMonth(now.getMonth() + 1);
  }
  now.setDate(paymentDay);

  return now.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Compare two dates (DD/MM/YYYY or MM/YYYY format)
 * Returns: -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
function compareDates(date1: string, date2: string): number {
  const v1 = parseDateToMonthIndex(date1);
  const v2 = parseDateToMonthIndex(date2);

  if (Math.abs(v1 - v2) < 0.0001) return 0;
  return v1 < v2 ? -1 : 1;
}

/**
 * Check if two dates fall in the same calendar month
 */
function isSameMonth(date1: string, date2: string): boolean {
  const m1 = parseMonth(date1);
  const m2 = parseMonth(date2);
  return m1 === m2;
}

export function CurrentMonthPreview() {
  const { t, i18n } = useTranslation('portfolio-page');
  const { plans: allPlans, amortizationRows: rows, currency } = usePlans();
  const plans = allPlans.filter(p => p.enabled !== false);

  const currentDateInternal = getCurrentDate();
  const displayDate = getDisplayDate(i18n.language);

  // Determine payment day from the first plan, or default to 10
  const paymentDay = useMemo(() => {
    if (plans.length > 0) {
      const firstPlan = plans[0];
      // Extract day from DD/MM/YYYY
      const day = parseInt(firstPlan.firstPaymentDate.split('/')[0], 10);
      return isNaN(day) ? 10 : day;
    }
    return 10;
  }, [plans]);

  const nextPaymentDate = getNextPaymentDate(paymentDay, i18n.language);

  const aggregatedData = useMemo(() => {
    const result = {
      totalPayment: 0,
      totalPrincipal: 0,
      totalInterest: 0,
      totalRemainingBalance: 0,
    };

    if (plans.length === 0) {
      return result;
    }

    plans.forEach((plan) => {
      // Find all rows for this plan
      const planRows = rows.filter((r) => r.planId === plan.id);

      // Check if plan has started
      const planStartIdx = parseDateToMonthIndex(plan.firstPaymentDate);
      const currentIdx = parseDateToMonthIndex(currentDateInternal);

      if (planStartIdx > currentIdx) {
        // Plan hasn't started yet
        result.totalRemainingBalance += plan.amount;
        return;
      }

      // Find rows up to and including current date
      // IMPORTANT: Row 'month' field might be DD/MM/YYYY
      const currentOrPastRows = planRows.filter(
        (r) => compareDates(r.month, currentDateInternal) <= 0
      );

      if (currentOrPastRows.length === 0) {
        result.totalRemainingBalance += plan.amount;
        return;
      }

      // Get the latest row (closest to current date)
      const latestRow = currentOrPastRows.reduce((latest, row) => {
        return compareDates(row.month, latest.month) > 0 ? row : latest;
      });

      // If the latest row is in the current calendar month
      if (isSameMonth(latestRow.month, currentDateInternal)) {
        result.totalPayment += latestRow.monthlyPayment;
        result.totalPrincipal += latestRow.principal;
        result.totalInterest += latestRow.interest;
        result.totalRemainingBalance += latestRow.endingBalance;
      } else {
        // Past month, always use ending balance
        result.totalRemainingBalance += latestRow.endingBalance;
      }
    });

    return result;
  }, [plans, rows, currentDateInternal]);

  if (plans.length === 0) {
    return (
      <Card gradient>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
              <CalendarDays className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{t('preview.title')}</CardTitle>
              <CardDescription>{displayDate}</CardDescription>
            </div>
          </div>
          <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
        </CardHeader>
        <CardContent className="p-8 text-center text-muted-foreground">
          {t('preview.empty')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card gradient>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
            <CalendarDays className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">{t('preview.title')}</CardTitle>
            <CardDescription>{displayDate}</CardDescription>
          </div>
        </div>
        <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {
          plans.length === 0
            ? (
              t('preview.empty')
            )
            : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Total Payment - Green */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 text-white shadow-lg shadow-emerald-500/20 group hover:scale-[1.02] transition-transform duration-300">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3 opacity-90">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm font-medium">{t('preview.totalPayment')}</span>
                      </div>
                      <div className="text-2xl font-bold tracking-tight">
                        {formatCurrency(aggregatedData.totalPayment, currency)}
                      </div>
                    </div>
                  </div>

                  {/* Principal - Blue */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-5 text-white shadow-lg shadow-blue-500/20 group hover:scale-[1.02] transition-transform duration-300">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3 opacity-90">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-medium">{t('preview.principal')}</span>
                      </div>
                      <div className="text-2xl font-bold tracking-tight">
                        {formatCurrency(aggregatedData.totalPrincipal, currency)}
                      </div>
                    </div>
                  </div>

                  {/* Interest - Orange */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-5 text-white shadow-lg shadow-orange-500/20 group hover:scale-[1.02] transition-transform duration-300">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3 opacity-90">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm font-medium">{t('preview.interest')}</span>
                      </div>
                      <div className="text-2xl font-bold tracking-tight">
                        {formatCurrency(aggregatedData.totalInterest, currency)}
                      </div>
                    </div>
                  </div>

                  {/* Next Payment - Purple */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-5 text-white shadow-lg shadow-purple-500/20 group hover:scale-[1.02] transition-transform duration-300">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3 opacity-90">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-medium">{t('preview.nextPayment')}</span>
                      </div>
                      <div className="text-2xl font-bold tracking-tight">
                        {nextPaymentDate}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer - Remaining Balance */}
                <div className="bg-secondary/5 rounded-xl p-4 flex items-center justify-between border border-border/50">
                  <span className="text-sm font-medium text-muted-foreground">{t('preview.remainingBalance')}</span>
                  <span className="text-xl font-bold text-foreground">
                    {formatCurrency(aggregatedData.totalRemainingBalance, currency)}
                  </span>
                </div>
              </>
            )
        }
      </CardContent>

    </Card>
  );
}

