
import { useMemo } from 'react';
import { usePortfolios } from '@/context/PortfoliosContext';
import { useCPI } from '@/hooks/useCPI';
import { getAggregateDashboardData } from '@/lib/dashboardUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Coins, CreditCard, Building, Wallet } from 'lucide-react';

import { useTranslation } from 'react-i18next';

export function DashboardStats() {
    const { t } = useTranslation('dashboard');
    const { portfolios } = usePortfolios();
    const cpiData = useCPI();

    const data = useMemo(() => {
        return getAggregateDashboardData(portfolios, cpiData);
    }, [portfolios, cpiData]);

    // Format data for charts
    const chartData = data.portfolioStats.map(stat => ({
        name: stat.name,
        balance: Math.round(stat.totalBalance),
        payment: Math.round(stat.monthlyPayment),
        color: stat.color?.replace('bg-', '') || 'blue-500' // Simple mapping, might need more robust color logic
    }));

    // Map Tailwind color names to hex codes for Recharts
    // This is a simplified mapping. In a real app we might use a proper theme provider or utility
    const getColorHex = (colorName: string) => {
        const colors: Record<string, string> = {
            'bg-slate-500': 'oklch(55.4% 0.046 257.417)',
            'bg-red-500': 'oklch(63.7% 0.237 25.331)',
            'bg-orange-500': 'oklch(70.5% 0.213 47.604)',
            'bg-amber-500': 'oklch(76.9% 0.188 70.08)',
            'bg-yellow-500': 'oklch(79.5% 0.184 86.047)',
            'bg-lime-500': 'oklch(76.8% 0.233 130.85)',
            'bg-green-500': 'oklch(72.3% 0.219 149.579)',
            'bg-emerald-500': 'oklch(69.6% 0.17 162.48)',
            'bg-teal-500': 'oklch(70.4% 0.14 182.503)',
            'bg-cyan-500': 'oklch(71.5% 0.143 215.221)',
            'bg-sky-500': 'oklch(68.5% 0.169 237.323)',
            'bg-blue-500': 'oklch(62.3% 0.214 259.815)',
            'bg-indigo-500': 'oklch(58.5% 0.233 277.117)',
            'bg-violet-500': 'oklch(60.6% 0.25 292.717)',
            'bg-purple-500': 'oklch(62.7% 0.265 303.9)',
            'bg-fuchsia-500': 'oklch(66.7% 0.295 322.15)',
            'bg-pink-500': 'oklch(65.6% 0.241 354.308)',
            'bg-rose-500': 'oklch(64.5% 0.246 16.439)',
        };
        return colors[colorName] || '#3b82f6';
    };

    return (
        <div className="space-y-6 mb-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card gradient>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('stats.totalBalance')}</CardTitle>
                            <Coins className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(data.totalBalance, 'ILS')}</div>
                            <p className="text-xs text-muted-foreground">{t('stats.totalBalanceDesc')}</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card gradient>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('stats.monthlyPayment')}</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(data.totalMonthlyPayment, 'ILS')}</div>
                            <p className="text-xs text-muted-foreground">{t('stats.monthlyPaymentDesc')}</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card gradient>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('stats.activePortfolios')}</CardTitle>
                            <Building className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{portfolios.length}</div>
                            <p className="text-xs text-muted-foreground">{t('stats.activePortfoliosDesc')}</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <Card gradient>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('stats.avgPayment')}</CardTitle>
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {portfolios.length > 0 ? formatCurrency(data.totalMonthlyPayment / portfolios.length, 'ILS') : 0}
                            </div>
                            <p className="text-xs text-muted-foreground">{t('stats.avgPaymentDesc')}</p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                    <Card gradient className="h-[350px]">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">{t('charts.balanceDistribution')}</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="balance"
                                    >
                                        {chartData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={getColorHex(data.portfolioStats[index].color || 'blue-500')} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: any) => {
                                            if (typeof value === 'number') return formatCurrency(value, 'ILS');
                                            return value;
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
                    <Card gradient className="h-[350px]">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">{t('charts.monthlyPayments')}</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: 'currentColor', fontSize: 12 }}
                                    />
                                    <YAxis
                                        tickFormatter={(value) => `₪${value / 1000}k`}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: 'currentColor', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        formatter={(value: any) => {
                                            if (typeof value === 'number') return formatCurrency(value, 'ILS');
                                            return value;
                                        }}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Bar dataKey="payment" radius={[4, 4, 0, 0]}>
                                        {chartData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={getColorHex(data.portfolioStats[index].color || 'blue-500')} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
