import { useMemo } from 'react';
import { AmortizationRow, MortgagePlan, ExtraPayment } from '@/types';
import { CurrencyCode, formatCurrency, getCurrencySymbol } from '@/lib/currency';
import { getPlanDisplayName } from '@/lib/planUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MortgageSummaryProps {
  rows: AmortizationRow[];
  plans: MortgagePlan[];
  extraPayments: ExtraPayment[];
  currency: CurrencyCode;
}

// PMT calculation helper
function calculatePMT(principal: number, monthlyRate: number, numPayments: number): number {
  if (monthlyRate === 0) {
    return principal / numPayments;
  }
  const factor = Math.pow(1 + monthlyRate, numPayments);
  return principal * (monthlyRate * factor) / (factor - 1);
}

export function MortgageSummary({ rows, plans, extraPayments, currency }: MortgageSummaryProps) {
  const summary = useMemo(() => {
    if (rows.length === 0) {
      return null;
    }

    // Calculate totals with extra payments
    let totalPaid = 0;
    let totalInterest = 0;
    const planTotals = new Map<string, { paid: number; interest: number; principal: number }>();

    for (const row of rows) {
      totalPaid += row.monthlyPayment;
      totalInterest += row.interest;
      
      const existing = planTotals.get(row.planId) || { paid: 0, interest: 0, principal: 0 };
      planTotals.set(row.planId, {
        paid: existing.paid + row.monthlyPayment,
        interest: existing.interest + row.interest,
        principal: existing.principal + row.principal,
      });
    }

    // Calculate totals without extra payments
    let totalPaidWithoutExtra = 0;
    let totalInterestWithoutExtra = 0;

    for (const plan of plans) {
      const monthlyRate = plan.annualRate / 100 / 12;
      let balance = plan.initialAmount;
      
      for (let i = 0; i < plan.termMonths; i++) {
        const interest = balance * monthlyRate;
        const payment = calculatePMT(plan.initialAmount, monthlyRate, plan.termMonths);
        const principal = payment - interest;
        
        totalPaidWithoutExtra += payment;
        totalInterestWithoutExtra += interest;
        
        balance = Math.max(0, balance - principal);
        if (balance <= 0.01) break;
      }
    }

    const savings = {
      total: totalPaidWithoutExtra - totalPaid,
      interest: totalInterestWithoutExtra - totalInterest,
    };

    return {
      withExtra: {
        totalPaid,
        totalInterest,
        principal: totalPaid - totalInterest,
      },
      withoutExtra: {
        totalPaid: totalPaidWithoutExtra,
        totalInterest: totalInterestWithoutExtra,
        principal: totalPaidWithoutExtra - totalInterestWithoutExtra,
      },
      savings,
      planTotals: Array.from(planTotals.entries()).map(([planId, totals]) => {
        const plan = plans.find((p) => p.id === planId);
        return {
          planId,
          planName: plan
            ? getPlanDisplayName(plan, currency)
            : planId,
          ...totals,
        };
      }),
    };
  }, [rows, plans, extraPayments, currency]);

  const formatCurrencyValue = (value: number) => formatCurrency(value, currency);

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Add a mortgage plan to see the summary.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mortgage Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Revised Loan Projection</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Paid:</span>
                  <span className="font-medium">{formatCurrencyValue(summary.withExtra.totalPaid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Interest:</span>
                  <span className="font-medium">{formatCurrencyValue(summary.withExtra.totalInterest)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Principal Paid:</span>
                  <span className="font-medium">{formatCurrencyValue(summary.withExtra.principal)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Initial Loan Projection</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Paid:</span>
                  <span className="font-medium">{formatCurrencyValue(summary.withoutExtra.totalPaid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Interest:</span>
                  <span className="font-medium">{formatCurrencyValue(summary.withoutExtra.totalInterest)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Principal Paid:</span>
                  <span className="font-medium">{formatCurrencyValue(summary.withoutExtra.principal)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className={`text-lg font-semibold mb-3 text-${summary.savings.total > 0 ? 'green' : 'red'}-600`}>Savings</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Savings:</span>
                  <span className={`font-medium text-${summary.savings.total > 0 ? 'green' : 'red'}-600`}>
                    {formatCurrencyValue(summary.savings.total)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Interest Savings:</span>
                  <span className={`font-medium text-${summary.savings.total > 0 ? 'green' : 'red'}-600`}>
                    {formatCurrencyValue(summary.savings.interest)}
                  </span>
                </div>
              </div>
            </div>

            {summary.planTotals.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">By Plan</h3>
                <div className="space-y-3">
                  {summary.planTotals.map((planTotal) => (
                    <div key={planTotal.planId} className="border rounded-md p-3">
                      <div className="font-medium mb-2">{planTotal.planName}</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Paid:</span>
                          <span>{formatCurrencyValue(planTotal.paid)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Interest:</span>
                          <span>{formatCurrencyValue(planTotal.interest)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Principal:</span>
                          <span>{formatCurrencyValue(planTotal.principal)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
