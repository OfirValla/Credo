
import { MortgagePortfolio, Plan, ExtraPayment, RateChange, GracePeriod } from '@/types';
import { calculateAmortizationSchedule } from '@/lib/mortgageCalculations';
import { CurrencyCode } from '@/lib/currency';

interface PortfolioStats {
    id: string;
    name: string;
    totalBalance: number;
    monthlyPayment: number;
    color?: string;
}

interface DashboardData {
    totalBalance: number;
    totalMonthlyPayment: number;
    portfolioStats: PortfolioStats[];
}

export function getAggregateDashboardData(
    portfolios: MortgagePortfolio[],
    cpiData: any
): DashboardData {
    let totalBalance = 0;
    let totalMonthlyPayment = 0;
    const portfolioStats: PortfolioStats[] = [];

    portfolios.forEach(portfolio => {
        // Read directly from localStorage to avoid loading all contexts
        const suffix = portfolio.id && portfolio.id !== 'default' ? `-${portfolio.id}` : '';

        try {
            const plansStr = localStorage.getItem(`${portfolio.type}-plans${suffix}`);
            const extraPaymentsStr = localStorage.getItem(`${portfolio.type}-extra-payments${suffix}`);
            const rateChangesStr = localStorage.getItem(`${portfolio.type}-rate-changes${suffix}`);
            const gracePeriodsStr = localStorage.getItem(`${portfolio.type}-grace-periods${suffix}`);
            const currencyStr = localStorage.getItem(`${portfolio.type}-currency${suffix}`);

            const plans: Plan[] = plansStr ? JSON.parse(plansStr) : [];
            const extraPayments: ExtraPayment[] = extraPaymentsStr ? JSON.parse(extraPaymentsStr) : [];
            const rateChanges: RateChange[] = rateChangesStr ? JSON.parse(rateChangesStr) : [];
            const gracePeriods: GracePeriod[] = gracePeriodsStr ? JSON.parse(gracePeriodsStr) : [];
            const currency: CurrencyCode = currencyStr ? JSON.parse(currencyStr) : 'ILS'; // Default to ILS if not found, though usually 'ILS' is string literal

            if (!plans || plans.length === 0) {
                portfolioStats.push({
                    id: portfolio.id,
                    name: portfolio.name,
                    totalBalance: 0,
                    monthlyPayment: 0,
                    color: portfolio.color
                });
                return;
            }

            const amortizationSchedule = calculateAmortizationSchedule(
                plans,
                extraPayments,
                rateChanges,
                gracePeriods,
                currency,
                cpiData
            );

            const currentBalance = plans.reduce((sum, plan) => sum + plan.amount, 0); // Simplified: This is original amount. We should calculate current balance if possible or just use schedule.

            // Better approach for Current Balance: Use the amortization schedule
            // However, calculateAmortizationSchedule returns the full schedule.
            // We need to find "now".

            let currentScheduleBalance = currentBalance;
            let currentMonthlyPayment = 0;

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

                // If we found rows for this month, sum them up
                if (currentMonthRows.length > 0) {
                    currentMonthlyPayment = currentMonthRows.reduce((sum, row) => sum + row.monthlyPayment, 0);
                    currentScheduleBalance = currentMonthRows.reduce((sum, row) => {
                        const paymentDay = parseInt(row.month.split('/')[0], 10);
                        return now.getDate() < paymentDay ? sum + row.startingBalance : sum + row.endingBalance;
                    }, 0);
                } else {
                    // If we are before the mortgage starts, it's the full amount.
                    // If we are after, it's 0.
                    const firstRow = amortizationSchedule[0];
                    const lastRow = amortizationSchedule[amortizationSchedule.length - 1];

                    // Simple date check
                    // This is a bit rough, but good enough for a summary
                    const firstParts = firstRow.month.split('/').map(Number); // D, M, Y
                    const firstDate = new Date(firstParts[2], firstParts[1] - 1, 1);

                    if (now < firstDate) {
                        currentMonthlyPayment = 0;
                        currentScheduleBalance = currentBalance; // Full amount
                    } else {
                        // Check if finished
                        const lastParts = lastRow.month.split('/').map(Number);
                        const lastDate = new Date(lastParts[2], lastParts[1] - 1, 1);
                        if (now > lastDate) {
                            currentScheduleBalance = 0;
                            currentMonthlyPayment = 0;
                        } else {
                            // We are somewhere in the middle but maybe a gap or just didn't catch the exact month?
                            // Fallback to first month payment as an estimate if needed, or 0.
                            // Let's try to find the closest previous month.
                            // For now, 0 is safer than wrong data.
                        }
                    }
                }
            }

            totalBalance += currentScheduleBalance;
            totalMonthlyPayment += currentMonthlyPayment;

            portfolioStats.push({
                id: portfolio.id,
                name: portfolio.name,
                totalBalance: currentScheduleBalance,
                monthlyPayment: currentMonthlyPayment,
                color: portfolio.color
            });

        } catch (e) {
            console.error(`Error loading data for portfolio ${portfolio.id}`, e);
        }
    });

    return {
        totalBalance,
        totalMonthlyPayment,
        portfolioStats
    };
}
