import { useMemo } from 'react';
import { Activity, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getPlanDisplayName } from '@/lib/planUtils';
import { useMortgage } from '@/context/MortgageProvider';

export function MortgageStatus() {
    const { plans: allPlans, amortizationRows: rows, currency } = useMortgage();
    const plans = allPlans.filter(p => p.enabled !== false);

    const statusData = useMemo(() => {
        const now = new Date();
        const currentMonthIndex = (now.getFullYear() - 2000) * 12 + now.getMonth();

        // Filter to only enabled plans (defaults to true if not set)
        const enabledPlans = plans.filter(plan => plan.enabled !== false);

        return enabledPlans.map(plan => {
            const planRows = rows.filter(r => r.planId === plan.id);

            const startMonthIndex = (parseInt(plan.takenDate.split('/')[2]) - 2000) * 12 + parseInt(plan.takenDate.split('/')[1]) - 1;

            let currentBalance = plan.amount;
            let monthlyPayment = 0;
            let interestRate = plan.interestRate;

            if (currentMonthIndex < startMonthIndex) {
                // Not started
                currentBalance = plan.amount;
            } else {
                // Find row for current month or closest past month
                // We need to parse row.month (MM/YYYY)
                const parseRowMonth = (m: string) => {
                    const [month, year] = m.split('/').map(Number);
                    return (year - 2000) * 12 + month - 1;
                };

                const relevantRows = planRows.filter(r => parseRowMonth(r.month) <= currentMonthIndex);
                if (relevantRows.length > 0) {
                    // Sort by month descending
                    relevantRows.sort((a, b) => parseRowMonth(b.month) - parseRowMonth(a.month));
                    const latestRow = relevantRows[0];

                    currentBalance = latestRow.endingBalance;
                    monthlyPayment = latestRow.monthlyPayment;
                    interestRate = latestRow.monthlyRate * 12 * 100; // Annual rate
                } else {
                    currentBalance = plan.amount;
                }
            }

            // Ensure balance is not negative
            currentBalance = Math.max(0, currentBalance);

            const principalPaid = plan.amount - currentBalance;
            const progress = (principalPaid / plan.amount) * 100;

            return {
                ...plan,
                currentBalance,
                progress,
                monthlyPayment,
                currentRate: interestRate,
                remainingMonths: plan.remainingMonths ?? 0
            };
        });
    }, [plans, rows]);

    const enabledPlansCount = plans.filter(plan => plan.enabled !== false).length;

    return (
        <Card gradient>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-6">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Activity className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                    <CardTitle className="text-lg font-semibold">Portfolio Status</CardTitle>
                    <CardDescription>Current standing of active plans</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-0">
                {
                    enabledPlansCount === 0
                        ? (
                            "No active plans"
                        )
                        : (
                            statusData.map((plan) => (
                                <div key={plan.id} className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-medium">{getPlanDisplayName(plan, currency)}</span>
                                        </div>
                                        <span className="text-sm font-medium text-muted-foreground">
                                            {plan.progress.toFixed(1)}% Paid
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(100, Math.max(0, plan.progress))}%` }}
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 sm:grid-cols-2 gap-4 text-sm">
                                        <div className="bg-secondary/10 p-2 rounded-md">
                                            <span className="text-muted-foreground block text-xs mb-1">Balance</span>
                                            <span className="font-bold text-foreground">
                                                {formatCurrency(plan.currentBalance, currency)}
                                            </span>
                                        </div>
                                        <div className="bg-secondary/10 p-2 rounded-md">
                                            <span className="text-muted-foreground block text-xs mb-1">Rate</span>
                                            <span className="font-bold text-foreground">
                                                {plan.currentRate.toFixed(2)}%
                                            </span>
                                        </div>
                                        <div className="bg-secondary/10 p-2 rounded-md">
                                            <span className="text-muted-foreground block text-xs mb-1">Remaining</span>
                                            <span className="font-bold text-foreground">
                                                {plan.remainingMonths} months
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )
                }
            </CardContent>
        </Card>
    );
}
