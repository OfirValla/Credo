import { AmortizationRow, MortgagePlan } from '@/types';
import { CurrencyCode, formatCurrency, getCurrencySymbol } from '@/lib/currency';
import { getPlanDisplayName } from '@/lib/planUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AmortizationTableProps {
  rows: AmortizationRow[];
  plans: MortgagePlan[];
  currency: CurrencyCode;
}

export function AmortizationTable({ rows, plans, currency }: AmortizationTableProps) {
  const formatCurrencyValue = (value: number) => formatCurrency(value, currency);

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(4)}%`;
  };

  const getPlanLabel = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return planId;
    return getPlanDisplayName(plan, currency);
  };

  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Amortization Table</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Add a mortgage plan to see the amortization table.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Amortization Table</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Starting Balance</TableHead>
                <TableHead className="text-right">Monthly Rate</TableHead>
                <TableHead className="text-right">Monthly Payment</TableHead>
                <TableHead className="text-right">Principal</TableHead>
                <TableHead className="text-right">Interest</TableHead>
                <TableHead className="text-right">Ending Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={`${row.planId}-${row.month}-${index}`}>
                  <TableCell className="font-medium">{row.month}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getPlanLabel(row.planId)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrencyValue(row.startingBalance)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPercentage(row.monthlyRate)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrencyValue(row.monthlyPayment)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrencyValue(row.principal)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrencyValue(row.interest)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrencyValue(row.endingBalance)}
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
