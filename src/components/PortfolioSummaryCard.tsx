import { useMemo } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Portfolio, Plan, ExtraPayment, RateChange, GracePeriod } from '@/types';
import { CurrencyCode, formatCurrency } from '@/lib/currency';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useCPI } from '@/hooks/useCPI';
import { calculateAmortizationSchedule } from '@/lib/mortgageCalculations';
import { usePortfolios } from '@/context/PortfoliosContext';
import { Link } from 'react-router';

interface PortfolioSummaryCardProps {
    portfolio: Portfolio;
}

export function PortfolioSummaryCard({ portfolio }: PortfolioSummaryCardProps) {
    const { setCurrentPortfolioId } = usePortfolios();
    const cpiData = useCPI();

    // Load portfolio specific data
    // Note: We are reading directly from local storage to avoid loading all contexts at once
    // This mimics how the PlanProvider loads data but for a specific portfolio ID
    const suffix = portfolio.id && portfolio.id !== 'default' ? `-${portfolio.id}` : '';

    const [plans] = useLocalStorage<Plan[]>(`${portfolio.type}-plans${suffix}`, []);
    const [extraPayments] = useLocalStorage<ExtraPayment[]>(`${portfolio.type}-extra-payments${suffix}`, []);
    const [rateChanges] = useLocalStorage<RateChange[]>(`${portfolio.type}-rate-changes${suffix}`, []);
    const [gracePeriods] = useLocalStorage<GracePeriod[]>(`${portfolio.type}-grace-periods${suffix}`, []);
    const [currency] = useLocalStorage<CurrencyCode>(`${portfolio.type}-currency${suffix}`, 'ILS');

    const summary = useMemo(() => {
        if (!plans || plans.length === 0) {
            return {
                balance: 0,
                remainingBalance: 0,
                monthlyPayment: 0,
                planCount: 0
            };
        }

        const amortizationSchedule = calculateAmortizationSchedule(
            plans,
            extraPayments,
            rateChanges,
            gracePeriods,
            currency,
            cpiData
        );

        const totalBalance = plans.reduce((sum, plan) => sum + plan.amount, 0);

        // Calculate current monthly payment
        let monthlyPayment = 0;
        let remainingBalance = totalBalance;
        if (amortizationSchedule.length > 0) {
            const now = new Date();
            const currentMonth = now.getMonth() + 1;
            const currentYear = now.getFullYear();

            const currentMonthRows = amortizationSchedule.filter(row => {
                const parts = row.month.split('/');
                if (parts.length === 3) {
                    const [, m, y] = parts.map(Number);
                    return m === currentMonth && y === currentYear;
                }
                return false;
            });

            if (currentMonthRows.length > 0) {
                monthlyPayment = currentMonthRows.reduce((sum, row) => sum + row.monthlyPayment, 0);
                remainingBalance = currentMonthRows.reduce((sum, row) => {
                    const paymentDay = parseInt(row.month.split('/')[0], 10);
                    const paymentMonth = parseInt(row.month.split('/')[1], 10);
                    const paymentYear = parseInt(row.month.split('/')[2], 10);
                    const paymentDate = new Date(paymentYear, paymentMonth - 1, paymentDay);

                    return now < paymentDate ? sum + row.startingBalance : sum + row.endingBalance;
                }, 0);
            } else {
                // Fallback to first month if current month not found (e.g. future start)
                const firstMonth = amortizationSchedule[0].month;
                monthlyPayment = amortizationSchedule
                    .filter(row => row.month === firstMonth)
                    .reduce((sum, row) => sum + row.monthlyPayment, 0);
            }
        }

        return {
            balance: totalBalance,
            remainingBalance: remainingBalance,
            monthlyPayment,
            planCount: plans.length
        };
    }, [plans, extraPayments, rateChanges, gracePeriods, currency, cpiData]);

    const Icon = (portfolio.icon && (Icons as any)[portfolio.icon])
        ? (Icons as any)[portfolio.icon]
        : Building;
    return (
        <motion.div
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
        >
            <Card className="h-full overflow-hidden border-l-4" style={{ borderLeftColor: `var(--${portfolio.color?.replace('bg-', '') || 'primary'})` }}>
                <CardHeader className="pb-2">
                    <div className="grid grid-flow-col items-center justify-start gap-[20px] [grid-template-columns:auto_1fr_min-content]">
                        <div className={`p-2 rounded-lg ${portfolio.color ? portfolio.color : 'bg-primary/10'} text-white`}>
                            {/* Icon placeholder - in a real app we'd map the string icon name to a component again */}
                            <Icon className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-xl">{portfolio.name}</CardTitle>
                        <Link
                            to={`/${portfolio.type}/${portfolio.id}`}
                            onClick={() => setCurrentPortfolioId(portfolio.id)}
                        >
                            <Icons.ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 mt-2">
                        <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Icons.DollarSign className="w-4 h-4" />
                                <span className="text-sm">Balance</span>
                            </div>
                            <span className="font-bold text-lg">{formatCurrency(summary.balance, currency)}</span>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Icons.CreditCard className="w-4 h-4" />
                                <span className="text-sm">Monthly</span>
                            </div>
                            <span className="font-bold text-lg">{formatCurrency(summary.monthlyPayment, currency)}</span>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Icons.CreditCard className="w-4 h-4" />
                                <span className="text-sm">Remaining Balance</span>
                            </div>
                            <span className="font-bold text-lg">{formatCurrency(summary.remainingBalance, currency)}</span>
                        </div>

                        <div className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                            <Icons.Building className="w-3 h-3" />
                            {summary.planCount} active plans
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
