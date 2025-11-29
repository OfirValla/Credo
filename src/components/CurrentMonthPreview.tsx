import { useMemo } from 'react';
import { Calendar, DollarSign, TrendingUp, Sparkles, CalendarDays } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useMortgage } from '@/context/MortgageProvider';

/**
 * Get current month in MM/YYYY format
 */
function getCurrentMonth(): string {
  const now = new Date();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear();
  return `${month}/${year}`;
}

/**
 * Get display date string (e.g., "20 November 2025")
 */
function getDisplayDate(): string {
  const now = new Date();
  return now.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Get next payment date (e.g., "10 Dec")
 * Assuming payments are due on the 10th of the next month
 */
function getNextPaymentDate(): string {
  const now = new Date();
  // Move to next month
  if (now.getMonth() === 11) {
    now.setFullYear(now.getFullYear() + 1);
    now.setMonth(0);
  } else {
    now.setMonth(now.getMonth() + 1);
  }
  now.setDate(10); // Assuming 10th is payment day

  return now.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Parse MM/YYYY or DD/MM/YYYY date string and convert to month number
 */
function parseMonth(dateStr: string): number {
  if (!dateStr) return 0;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    // DD/MM/YYYY
    const [, month, year] = parts.map(Number);
    return (year - 2000) * 12 + month - 1;
  } else if (parts.length === 2) {
    // MM/YYYY
    const [month, year] = parts.map(Number);
    return (year - 2000) * 12 + month - 1;
  }
  return 0;
}

/**
 * Compare two months (MM/YYYY format)
 * Returns: -1 if month1 < month2, 0 if equal, 1 if month1 > month2
 */
function compareMonths(month1: string, month2: string): number {
  const m1 = parseMonth(month1);
  const m2 = parseMonth(month2);
  return m1 - m2;
}

export function CurrentMonthPreview() {
  const { plans: allPlans, amortizationRows: rows, currency } = useMortgage();
  const plans = allPlans.filter(p => p.enabled !== false);

  const currentMonth = getCurrentMonth();
  const displayDate = getDisplayDate();
  const nextPaymentDate = getNextPaymentDate();

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
      const planStartMonth = parseMonth(plan.firstPaymentDate);
      const currentMonthNum = parseMonth(currentMonth);

      if (planStartMonth > currentMonthNum) {
        // Plan hasn't started yet
        result.totalRemainingBalance += plan.amount;
        return;
      }

      // Find rows up to and including current month
      const currentOrPastRows = planRows.filter(
        (r) => compareMonths(r.month, currentMonth) <= 0
      );

      if (currentOrPastRows.length === 0) {
        result.totalRemainingBalance += plan.amount;
        return;
      }

      // Get the latest row (closest to current month)
      const latestRow = currentOrPastRows.reduce((latest, row) => {
        return compareMonths(row.month, latest.month) > 0 ? row : latest;
      });

      // If the latest row IS the current month, add payment details
      if (compareMonths(latestRow.month, currentMonth) === 0) {
        result.totalPayment += latestRow.monthlyPayment;
        result.totalPrincipal += latestRow.principal;
        result.totalInterest += latestRow.interest;

        // Check if payment has been made yet (based on current day vs payment day)
        const now = new Date();
        const currentDay = now.getDate();

        // Extract payment day from firstPaymentDate (DD/MM/YYYY)
        // Default to 1st if parsing fails
        const paymentDay = parseInt(plan.firstPaymentDate.split('/')[0], 10) || 1;

        if (currentDay < paymentDay) {
          // Payment not yet made, show starting balance
          result.totalRemainingBalance += latestRow.startingBalance;
        } else {
          // Payment made, show ending balance
          result.totalRemainingBalance += latestRow.endingBalance;
        }
      } else {
        // Past month, always use ending balance
        result.totalRemainingBalance += latestRow.endingBalance;
      }
    });

    return result;
  }, [plans, rows, currentMonth]);

  if (plans.length === 0) {
    return (
      <Card gradient>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
              <CalendarDays className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Current Month Preview</CardTitle>
              <CardDescription>{displayDate}</CardDescription>
            </div>
          </div>
          <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
        </CardHeader>
        <CardContent className="p-8 text-center text-muted-foreground">
          Add a mortgage plan to see the current month preview.
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
            <CardTitle className="text-xl font-bold">Current Month Preview</CardTitle>
            <CardDescription>{displayDate}</CardDescription>
          </div>
        </div>
        <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {
          plans.length === 0
            ? (
              "Add a mortgage plan to see the current month preview."
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
                        <span className="text-sm font-medium">Total Payment</span>
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
                        <span className="text-sm font-medium">Principal</span>
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
                        <span className="text-sm font-medium">Interest</span>
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
                        <span className="text-sm font-medium">Next Payment</span>
                      </div>
                      <div className="text-2xl font-bold tracking-tight">
                        {nextPaymentDate}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer - Remaining Balance */}
                <div className="bg-secondary/5 rounded-xl p-4 flex items-center justify-between border border-border/50">
                  <span className="text-sm font-medium text-muted-foreground">Remaining Balance</span>
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

