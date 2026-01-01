import { useMemo } from 'react';
import { PieChart, DollarSign, TrendingUp, Calendar, CreditCard, Layers } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { usePlans } from '@/context/PlanProvider';

import { useTranslation } from 'react-i18next';


export function PortfolioSummary() {
  const { t } = useTranslation('portfolio-page');
  const { plans: allPlans, amortizationRows: rows, currency, extraPayments: allExtraPayments } = usePlans();
  const plans = allPlans.filter(p => p.enabled !== false);
  const extraPayments = allExtraPayments.filter(ep => ep.enabled !== false);

  const summary = useMemo(() => {
    if (rows.length === 0 || plans.length === 0) {
      return null;
    }

    // Calculate totals
    let totalInterest = 0;
    let totalPaid = 0;

    // We use the rows to get the actual projected interest and payments
    // This accounts for extra payments and rate changes if they are reflected in the rows
    for (const row of rows) {
      totalInterest += row.interest;
      totalPaid += row.monthlyPayment;
    }

    const totalPrincipal = plans.reduce((sum, plan) => sum + plan.amount, 0);

    // If totalPaid from rows is less than principal (e.g. very early in schedule), 
    // we should at least show the principal + interest. 
    // However, usually totalPaid > totalPrincipal.
    // Let's ensure totalPaid is at least principal + interest
    const actualTotalPaid = Math.max(totalPaid, totalPrincipal + totalInterest);

    // Calculate duration (max months across all plans)
    // We can find the max month index from the rows
    let maxMonthIndex = 0;
    rows.forEach(row => {
      const [m, y] = row.month.split('/').map(Number);
      const monthIndex = (y * 12) + m;
      if (monthIndex > maxMonthIndex) maxMonthIndex = monthIndex;
    });

    // To get a rough "months remaining" or "total duration", we can look at the plan with the longest term
    // OR better, look at the number of unique months in the rows
    const uniqueMonths = new Set(
      rows.filter(row => !row.tags?.find(tag => tag.type === 'grace-period'))
        .map(r => r.month.slice(3))
    );
    const durationMonths = uniqueMonths.size;


    return {
      totalPrincipal,
      totalInterest,
      totalPaid: actualTotalPaid,
      durationMonths,
      principalPct: (totalPrincipal / actualTotalPaid) * 100,
      interestPct: (totalInterest / actualTotalPaid) * 100,
    };
  }, [rows, plans]);

  if (!summary) {
    return (
      <Card gradient>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-6">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <PieChart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">{t('summary.title')}</CardTitle>
            <CardDescription>{t('summary.description')}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-8 text-center text-muted-foreground">
          {t('summary.empty')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card gradient>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-6">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <PieChart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <CardTitle className="text-lg font-semibold">{t('summary.title')}</CardTitle>
          <CardDescription>{t('summary.description')}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-8 pt-0">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex h-8 w-full overflow-hidden rounded-[0.5rem] text-white text-sm font-medium gap-2">
            <div
              className="bg-blue-600 flex items-center justify-center transition-all duration-500 rounded-l-[0.5rem]"
              style={{ width: `${summary.principalPct}% ` }}
            >
              {t('summary.principal')}
            </div>
            <div
              className="bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center transition-all duration-500 rounded-r-[0.5rem]"
              style={{ width: `${summary.interestPct}% ` }}
            >
              {t('summary.interest')}
            </div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground px-1">
            <span>{t('summary.principal')}: {summary.principalPct.toFixed(1)}%</span>
            <span>{t('summary.interest')}: {summary.interestPct.toFixed(1)}%</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Total Principal */}
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-medium">{t('summary.totalPrincipal')}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(summary.totalPrincipal, currency)}
            </div>
          </div>

          {/* Total Interest */}
          <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">{t('summary.totalInterest')}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(summary.totalInterest, currency)}
            </div>
          </div>

          {/* Total Payments */}
          <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-medium">{t('summary.totalPayments')}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(summary.totalPaid, currency)}
            </div>
          </div>

          {/* Duration */}
          <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">{t('summary.duration')}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {summary.durationMonths} {t('summary.monthUnit')}
            </div>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="bg-secondary/20 rounded-lg p-3 flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Layers className="w-4 h-4" />
              <span>{t('summary.activePlans')}</span>
            </div>
            <span className="font-bold">{plans.length}</span>
          </div>
          <div className="bg-secondary/20 rounded-lg p-3 flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="w-4 h-4" />
              <span>{t('summary.extraPayments')}</span>
            </div>
            <span className="font-bold">{extraPayments.filter(extra => extra.enabled).length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
