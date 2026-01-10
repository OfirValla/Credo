import { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Table2, Filter, Check, Download, Maximize2, Minimize2 } from 'lucide-react';
import { AmortizationRow } from '@/types';
import { formatCurrency } from '@/lib/currency';
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
import { usePlans } from '@/context/PlanProvider';
import { SlidingSelect } from './ui/sliding-select';
import { useTranslation } from 'react-i18next';


type ViewMode = 'monthly' | 'yearly';

export function AmortizationTable() {
  const { t } = useTranslation('portfolio-page');
  const { plans: allPlans, amortizationRows: rows, currency } = usePlans();
  const plans = allPlans.filter(p => p.enabled !== false);

  const tableHeaderRef = useRef<HTMLTableSectionElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);
  const [isZoomed, setIsZoomed] = useState(false);

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

  const downloadCSV = () => {
    if (displayedRows.length === 0) return;

    // Define headers
    const headers = [
      viewMode === 'monthly' ? t('table.headers.month') : t('table.headers.year'),
      t('table.headers.plan'),
      t('table.headers.startingBalance'),
      t('table.headers.payment'),
      t('table.headers.principal'),
      t('table.headers.interest'),
      t('table.headers.endingBalance'),
      'Tags'
    ];

    // Convert rows to CSV data
    const csvContent = [
      headers.join(','),
      ...displayedRows.map(row => {
        const planLabel = getPlanLabel(row.planId).replace(/,/g, ''); // Remove commas to avoid CSV issues
        const tags = row.tags?.map(t => t.label).join('; ') || '';
        return [
          row.month,
          `"${planLabel}"`, // Quote strings that might contain spaces
          row.startingBalance.toFixed(2),
          row.monthlyPayment.toFixed(2),
          row.principal.toFixed(2),
          row.interest.toFixed(2),
          row.endingBalance.toFixed(2),
          `"${tags}"`
        ].join(',');
      })
    ].join('\n');

    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `amortization_schedule_${viewMode}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // Auto-scroll to current month/year
  useEffect(() => {
    // Small delay to ensure DOM is ready and animations are started
    const timer = setTimeout(() => {
      const currentElement = document.querySelector('[data-current="true"]');
      if (currentElement) {
        const container = tableContainerRef.current;
        if (container) {
          const headerHeight = tableHeaderRef.current?.offsetHeight ?? 0;
          const elementTop = currentElement.getBoundingClientRect().top;
          const containerTop = container.getBoundingClientRect().top;
          const relativeTop = elementTop - containerTop;

          container.scrollTo({
            behavior: 'smooth',
            top: container.scrollTop + relativeTop - headerHeight
          });
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [viewMode, displayedRows, isZoomed]);

  if (rows.length === 0) {
    return (
      <Card className="flex flex-col" gradient>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Table2 className="w-5 h-5 text-primary" />
            {t('table.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center text-muted-foreground">
          {t('table.empty')}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {isZoomed && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsZoomed(false)}
        />
      )}
      <motion.div
        layout
        transition={{ duration: 0.5 }}
        className={cn(
          isZoomed
            ? "fixed inset-0 m-auto w-[90vw] md:w-[70vw] h-[80vh] z-50"
            : "h-[calc(100vh-10.5rem)] w-[100%] sticky top-4"
        )}
      >
        <Card
          className="w-full h-full flex flex-col"
          gradient
        >
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 pb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                <Table2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">{t('table.title')}</CardTitle>
                <CardDescription>{t('table.description')}</CardDescription>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* View Mode Toggle */}
              <SlidingSelect
                value={viewMode}
                onValueChange={(e) => setViewMode(e as ViewMode)}
                options={[
                  { value: 'monthly', label: t('table.monthly') },
                  { value: 'yearly', label: t('table.yearly') },
                ]}
                color="bg-primary"
                textColor="text-primary-foreground"
              />

              <Button
                variant="outline"
                size="sm"
                className="h-9 border-dashed"
                onClick={downloadCSV}
                disabled={displayedRows.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                {t('table.exportCSV')}
              </Button>

              {/* Plan Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 border-dashed gap-2">
                    <Filter className="mr-2 h-4 w-4" />
                    {t('table.filter')}
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
                        className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer gap-2"
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
                        {t('table.noPlans')}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 border-dashed"
                onClick={() => setIsZoomed(!isZoomed)}
                title={isZoomed ? t('table.zoomOut') : t('table.zoomIn')}
              >
                {isZoomed ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-0 flex-1 overflow-auto min-h-0" ref={tableContainerRef}>
            <div>
              <table className="w-full caption-bottom text-sm table-fixed min-w-[800px]">
                <TableHeader className="sticky top-0 bg-background z-20 shadow-sm" ref={tableHeaderRef}>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="w-[100px] sticky left-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-r border-border/50">{viewMode === 'monthly' ? t('table.headers.month') : t('table.headers.year')}</TableHead>
                    <TableHead className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">{t('table.headers.plan')}</TableHead>
                    <TableHead className="text-right bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">{t('table.headers.startingBalance')}</TableHead>
                    <TableHead className="text-right bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">{t('table.headers.payment')}</TableHead>
                    <TableHead className="text-right bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">{t('table.headers.principal')}</TableHead>
                    <TableHead className="text-right bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">{t('table.headers.interest')}</TableHead>
                    <TableHead className="text-right bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">{t('table.headers.endingBalance')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        {t('table.noData')}
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

                      const rowClasses = isCurrent
                        ? "bg-blue-100/80 dark:bg-blue-900/30 hover:bg-blue-200/80 dark:hover:bg-blue-800/40 border-blue-300/50 dark:border-blue-700/50"
                        : row.isGracePeriod
                          ? "bg-yellow-50/50 dark:bg-yellow-900/10 hover:bg-yellow-100/50 dark:hover:bg-yellow-900/20"
                          : row.tags?.some(t => t.type === 'extra-payment')
                            ? "bg-green-50/50 dark:bg-green-900/10 hover:bg-green-100/50 dark:hover:bg-green-900/20"
                            : "hover:bg-primary/5";

                      const stickyCellClasses = isCurrent
                        ? "bg-blue-100 dark:bg-blue-900"
                        : row.isGracePeriod
                          ? "bg-yellow-50 dark:bg-yellow-900"
                          : row.tags?.some(t => t.type === 'extra-payment')
                            ? "bg-green-50 dark:bg-green-900"
                            : "bg-background";

                      return (
                        <TableRow
                          key={`${row.planId}-${row.month}-${index}`}
                          data-current={isCurrent}
                          className={cn(
                            "border-b border-border/50 transition-colors",
                            rowClasses
                          )}
                        >
                          <TableCell className={cn("font-medium sticky left-0 z-10 border-r border-border/50", stickyCellClasses)}>{row.month}</TableCell>
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
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
