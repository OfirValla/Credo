import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Table2, Filter, Check } from 'lucide-react';
import { AmortizationRow, MortgagePlan } from '@/types';
import { CurrencyCode, formatCurrency } from '@/lib/currency';
import { getPlanDisplayName } from '@/lib/planUtils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface AmortizationTableProps {
  rows: AmortizationRow[];
  plans: MortgagePlan[];
  currency: CurrencyCode;
}

type ViewMode = 'monthly' | 'yearly';

export function AmortizationTable({ rows, plans, currency }: AmortizationTableProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);

  const formatCurrencyValue = (value: number) => formatCurrency(value, currency);

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(4)}%`;
  };

  const getPlanLabel = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return planId;
    return getPlanDisplayName(plan, currency);
  };

  const togglePlanSelection = (planId: string) => {
    setSelectedPlanIds((prev) =>
      prev.includes(planId)
        ? prev.filter((id) => id !== planId)
        : [...prev, planId]
    );
  };

  const filteredRows = useMemo(() => {
    if (selectedPlanIds.length === 0) return rows;
    return rows.filter((row) => selectedPlanIds.includes(row.planId));
  }, [rows, selectedPlanIds]);

  const displayedRows = useMemo(() => {
    if (viewMode === 'monthly') return filteredRows;

    // Aggregate by year and plan
    const yearlyMap = new Map<string, AmortizationRow>();

    filteredRows.forEach((row) => {
      // Handle both MM/YYYY and DD/MM/YYYY formats
      const parts = row.month.split('/');
      const year = parts[parts.length - 1];
      const key = `${year}-${row.planId}`;

      if (!yearlyMap.has(key)) {
        yearlyMap.set(key, {
          ...row,
          month: year, // Display year instead of MM/YYYY
          principal: 0,
          interest: 0,
          monthlyPayment: 0,
        });
      }

      const yearlyRow = yearlyMap.get(key)!;
      yearlyRow.principal += row.principal;
      yearlyRow.interest += row.interest;
      yearlyRow.monthlyPayment += row.monthlyPayment;
      yearlyRow.endingBalance = row.endingBalance; // End of year balance
      // startingBalance is already set correctly from the first row encountered for this year
    });

    return Array.from(yearlyMap.values());
  }, [filteredRows, viewMode]);

  if (rows.length === 0) {
    return (
      <Card className="glass-card border-none">
        <CardHeader className="bg-primary/5 border-b border-border/50">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Table2 className="w-5 h-5 text-primary" />
            Amortization Table
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center text-muted-foreground">
          Add a mortgage plan to see the amortization table.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col" gradient>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
            <Table2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold">Amortization Table</CardTitle>
            <CardDescription>Detailed payment schedule</CardDescription>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex p-1 bg-background/50 rounded-lg border border-border/50">
            <button
              onClick={() => setViewMode('monthly')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                viewMode === 'monthly'
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setViewMode('yearly')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                viewMode === 'yearly'
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
              )}
            >
              Yearly
            </button>
          </div>

          {/* Plan Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 border-dashed">
                <Filter className="mr-2 h-4 w-4" />
                Filter Plans
                {selectedPlanIds.length > 0 && (
                  <span className="ml-2 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                    {selectedPlanIds.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="end">
              <div className="p-2 space-y-1">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                    onClick={() => togglePlanSelection(plan.id)}
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        selectedPlanIds.includes(plan.id)
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className={cn("h-3 w-3")} />
                    </div>
                    <span className="text-sm font-medium leading-none">
                      {getPlanDisplayName(plan, currency)}
                    </span>
                  </div>
                ))}
                {plans.length === 0 && (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No plans available
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:p-0">
        <div className="">
          <table className="w-full caption-bottom text-sm table-fixed">
            <TableHeader className="sticky top-0 bg-background z-20 shadow-sm">
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="w-[100px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">{viewMode === 'monthly' ? 'Month' : 'Year'}</TableHead>
                <TableHead className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">Plan</TableHead>
                <TableHead className="text-right bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">Starting Balance</TableHead>
                <TableHead className="text-right bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">Payment</TableHead>
                <TableHead className="text-right bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">Principal</TableHead>
                <TableHead className="text-right bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">Interest</TableHead>
                <TableHead className="text-right bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">Ending Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No data to display.
                  </TableCell>
                </TableRow>
              ) : (
                displayedRows.map((row, index) => {
                  // Check if this row is the current month or year
                  const now = new Date();
                  const currentMonth = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
                  const currentYear = String(now.getFullYear());

                  let isCurrent = false;
                  if (viewMode === 'monthly') {
                    // Check for MM/YYYY match at the end of the string
                    isCurrent = row.month.endsWith(currentMonth);
                  } else {
                    // In yearly mode, row.month is just the year
                    isCurrent = row.month === currentYear;
                  }

                  return (
                    <motion.tr
                      key={`${row.planId}-${row.month}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.02 }} // Reduced delay for performance with many rows
                      className={cn(
                        "border-b border-border/50 transition-colors",
                        isCurrent
                          ? "bg-blue-100/80 dark:bg-blue-900/30 hover:bg-blue-200/80 dark:hover:bg-blue-800/40 border-blue-300/50 dark:border-blue-700/50"
                          : row.isGracePeriod
                            ? "bg-yellow-50/50 dark:bg-yellow-900/10 hover:bg-yellow-100/50 dark:hover:bg-yellow-900/20"
                            : row.tags?.some(t => t.type === 'extra-payment')
                              ? "bg-green-50/50 dark:bg-green-900/10 hover:bg-green-100/50 dark:hover:bg-green-900/20"
                              : "hover:bg-primary/5"
                      )}
                    >
                      <TableCell className="font-medium">{row.month}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex flex-col gap-1">
                          <span>
                            {getPlanLabel(row.planId)} <span className="text-xs opacity-70">({formatPercentage(row.monthlyRate)})</span>
                          </span>
                          {row.tags && row.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {row.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className={cn(
                                    "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                                    tag.color || "bg-primary/10 text-primary"
                                  )}
                                >
                                  {tag.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrencyValue(row.startingBalance)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-primary">
                        {formatCurrencyValue(row.monthlyPayment)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-600 dark:text-green-400">
                        {formatCurrencyValue(row.principal)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-orange-600 dark:text-orange-400">
                        {formatCurrencyValue(row.interest)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrencyValue(row.endingBalance)}
                      </TableCell>
                    </motion.tr>
                  );
                })
              )}
            </TableBody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

