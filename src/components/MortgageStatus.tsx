import { useMemo } from 'react';
import { Activity, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getPlanDisplayName, parseMonth } from '@/lib/planUtils';
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

            const startMonthIndex = parseMonth(plan.takenDate);

            let currentBalance = plan.amount;
            let monthlyPayment = 0;
            let interestRate = plan.interestRate;
            let totalInterestPaid = 0;

            if (currentMonthIndex < startMonthIndex) {
                // Not started
                currentBalance = plan.amount;
            } else {
                // Find row for current month or closest past month
                const relevantRows = planRows.filter(r => parseMonth(r.month) <= currentMonthIndex);
                if (relevantRows.length > 0) {
                    // Sort by month descending
                    relevantRows.sort((a, b) => parseMonth(b.month) - parseMonth(a.month));
                    const latestRow = relevantRows[0];

                    currentBalance = latestRow.endingBalance;
                    monthlyPayment = latestRow.monthlyPayment;
                    interestRate = latestRow.monthlyRate * 12 * 100; // Annual rate

                    // Calculate total interest paid up to the current month
                    // Note: If we want total interest over the LIFETIME of the loan, we should sum all rows.
                    // The user asked: "how much money the user will pay for each unit of principal"
                    // "for a 880000 nis the rate is 1.67, and the inerest is 15,145 which means the user will pay 1.04 nis for each 1 nis he took"
                    // This implies (Principal + Total Interest) / Principal.
                    // Total Interest should be the projected total interest for the whole loan?
                    // "inerest is 15,145" for 880k seems very low for a full mortgage, unless it's a short term or very low rate.
                    // Or maybe it's interest paid SO FAR?
                    // "user will pay" implies future tense. So it should be total projected interest.

                    // Let's calculate TOTAL projected interest from the full schedule.
                    const totalProjectedInterest = planRows.reduce((sum, r) => sum + r.interest, 0);
                    totalInterestPaid = totalProjectedInterest;

                } else {
                    currentBalance = plan.amount;
                    // Even if not started, we can calculate projected interest if rows exist
                    const totalProjectedInterest = planRows.reduce((sum, r) => sum + r.interest, 0);
                    totalInterestPaid = totalProjectedInterest;
                }
            }

            // Ensure balance is not negative
            currentBalance = Math.max(0, currentBalance);

            const principalPaid = plan.amount - currentBalance;
            const progress = (principalPaid / plan.amount) * 100;

            // Cost per unit = (Principal + Total Interest) / Principal
            const totalCost = plan.amount + totalInterestPaid;
            const costPerUnit = plan.amount > 0 ? totalCost / plan.amount : 0;

            return {
                ...plan,
                currentBalance,
                progress,
                monthlyPayment,
                currentRate: interestRate,
                remainingMonths: plan.remainingMonths ?? 0,
                costPerUnit
            };
        });
    }, [plans, rows]);

    const enabledPlansCount = plans.filter(plan => plan.enabled !== false).length;

    if (enabledPlansCount === 0) {
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
                <CardContent className="p-8 text-center text-muted-foreground">
                    Add a mortgage plan to see the summary.
                </CardContent>
            </Card>
        )
    }

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
                                <MortgagePlanInfo title="Balance" data={formatCurrency(plan.currentBalance, currency)} />
                                <MortgagePlanInfo title="Rate" data={`${plan.currentRate.toFixed(2)}%`} />
                                <MortgagePlanInfo title="Remaining" data={`${plan.remainingMonths} months`} />
                                <MortgagePlanInfo title="Cost / Unit" data={formatCurrency(plan.costPerUnit, currency)} />
                            </div>
                        </div>
                    ))
                }
            </CardContent>
        </Card>
    );
}

const MortgagePlanInfo = ({ title, data }: { title: string, data: string }) => (
    <div className="bg-secondary/10 p-2 rounded-md">
        <span className="text-muted-foreground block text-xs mb-1">{title}</span>
        <span className="font-bold text-foreground">
            {data}
        </span>
    </div>
)