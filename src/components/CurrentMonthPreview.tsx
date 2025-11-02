import { useMemo, useState } from 'react';
import { MortgagePlan, AmortizationRow } from '@/types';
import { CurrencyCode, formatCurrency } from '@/lib/currency';
import { getPlanDisplayName } from '@/lib/planUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface CurrentMonthPreviewProps {
  plans: MortgagePlan[];
  rows: AmortizationRow[];
  currency: CurrencyCode;
}

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
 * Parse MM/YYYY date string and convert to month number
 */
function parseMonth(dateStr: string): number {
  const [month, year] = dateStr.split('/').map(Number);
  return (year - 2000) * 12 + month - 1;
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

interface RemainingPaymentsCellProps {
  count: number;
  months: string[];
}

function RemainingPaymentsCell({ count, months }: RemainingPaymentsCellProps) {
  const [open, setOpen] = useState(false);
  
  // Show up to 10 months in the popover
  const displayMonths = months.slice(0, 10);
  const hasMore = months.length > 10;

  if (count === 0) {
    return <span>0</span>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="text-primary hover:underline cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            setOpen(true);
          }}
        >
          {count}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="end">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Remaining Payments</h4>
          {displayMonths.length > 0 ? (
            <div className="max-h-48 overflow-y-auto space-y-1">
              {displayMonths.map((month, index) => (
                <div key={index} className="text-sm py-1">
                  {month}
                </div>
              ))}
              {hasMore && (
                <div className="text-xs text-muted-foreground pt-1">
                  ... and {months.length - 10} more
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No remaining payments</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function CurrentMonthPreview({ plans, rows, currency }: CurrentMonthPreviewProps) {
  const currentMonth = getCurrentMonth();

  const currentMonthData = useMemo(() => {
    if (plans.length === 0) {
      return [];
    }

    return plans.map((plan) => {
      // Find all rows for this plan
      const planRows = rows.filter((r) => r.planId === plan.id);
      
      // Check if plan has started
      const planStartMonth = parseMonth(plan.startDate);
      const currentMonthNum = parseMonth(currentMonth);
      
      if (planStartMonth > currentMonthNum) {
        // Plan hasn't started yet - calculate all months from start date
        const allMonths: string[] = [];
        for (let i = 0; i < plan.termMonths; i++) {
          const year = 2000 + Math.floor((planStartMonth + i) / 12);
          const month = ((planStartMonth + i) % 12) + 1;
          allMonths.push(`${month.toString().padStart(2, '0')}/${year}`);
        }
        
        return {
          plan,
          initialAmount: plan.initialAmount,
          remainingAmount: plan.initialAmount,
          currentRate: plan.annualRate,
          remainingPayments: plan.termMonths,
          remainingMonths: allMonths,
        };
      }

      // Find rows up to and including current month
      const currentOrPastRows = planRows.filter(
        (r) => compareMonths(r.month, currentMonth) <= 0
      );

      if (currentOrPastRows.length === 0) {
        // Plan has started but no rows calculated yet (shouldn't happen normally)
        return {
          plan,
          initialAmount: plan.initialAmount,
          remainingAmount: plan.initialAmount,
          currentRate: plan.annualRate,
          remainingPayments: plan.termMonths,
          remainingMonths: [],
        };
      }

      // Get the latest row (closest to current month)
      const latestRow = currentOrPastRows.reduce((latest, row) => {
        return compareMonths(row.month, latest.month) > 0 ? row : latest;
      });

      // Calculate remaining payments - count rows after the latest row
      const remainingRows = planRows.filter(
        (r) => compareMonths(r.month, latestRow.month) > 0
      );
      const remainingPayments = remainingRows.length;
      
      // Get remaining months (sorted)
      const remainingMonths = remainingRows
        .map((r) => r.month)
        .sort((a, b) => compareMonths(a, b));

      // Determine current rate - check if there's a row exactly at current month
      // Otherwise use the rate from the latest row
      const currentMonthRow = planRows.find(
        (r) => r.month === currentMonth
      );
      const monthlyRate = currentMonthRow
        ? currentMonthRow.monthlyRate
        : latestRow.monthlyRate;
      const currentRate = monthlyRate * 12 * 100;

      return {
        plan,
        initialAmount: plan.initialAmount,
        remainingAmount: latestRow.endingBalance,
        currentRate: currentRate,
        remainingPayments: remainingPayments > 0 ? remainingPayments : 0,
        remainingMonths,
      };
    });
  }, [plans, rows, currentMonth]);

  if (currentMonthData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Month Preview - {currentMonth}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Add a mortgage plan to see the current month preview.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Month Preview - {currentMonth}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Initial Amount</TableHead>
                <TableHead className="text-right">Remaining Amount</TableHead>
                <TableHead className="text-right">Current Rate (%)</TableHead>
                <TableHead className="text-right">Remaining Payments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentMonthData.map((data) => (
                <TableRow key={data.plan.id}>
                  <TableCell className="font-medium">
                    {getPlanDisplayName(data.plan, currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(data.initialAmount, currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(data.remainingAmount, currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {data.currentRate.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-right">
                    <RemainingPaymentsCell
                      count={data.remainingPayments}
                      months={data.remainingMonths || []}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
