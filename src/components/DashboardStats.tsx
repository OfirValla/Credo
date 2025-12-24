
import { useMemo } from 'react';
import { usePortfolios } from '@/context/PortfolioContext';
import { useCPI } from '@/hooks/useCPI';
import { getAggregateDashboardData } from '@/lib/dashboardUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Coins, CreditCard, Building, Wallet } from 'lucide-react';

export function DashboardStats() {
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
            'blue-500': '#3b82f6',
            'green-500': '#22c55e',
            'red-500': '#ef4444',
            'yellow-500': '#eab308',
            'purple-500': '#a855f7',
            'pink-500': '#ec4899',
            'indigo-500': '#6366f1',
            'orange-500': '#f97316',
            'teal-500': '#14b8a6',
            'cyan-500': '#06b6d4',
        };
        // fallback to extracting from portfolio color if possible or default
        const baseColor = colorName.replace('bg-', '').split('-')[0] + '-500';
        return colors[baseColor] || '#3b82f6';
    };

    return (
        <div className="space-y-6 mb-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card gradient>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                            <Coins className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(data.totalBalance, 'ILS')}</div>
                            <p className="text-xs text-muted-foreground">Outstanding principal across all portfolios</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card gradient>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Monthly Payment</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(data.totalMonthlyPayment, 'ILS')}</div>
                            <p className="text-xs text-muted-foreground">Combined monthly liability</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card gradient>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Portfolios</CardTitle>
                            <Building className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{portfolios.length}</div>
                            <p className="text-xs text-muted-foreground">Total managed portfolios</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <Card gradient>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg. Payment</CardTitle>
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {portfolios.length > 0 ? formatCurrency(data.totalMonthlyPayment / portfolios.length, 'ILS') : 0}
                            </div>
                            <p className="text-xs text-muted-foreground">Per portfolio</p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                    <Card gradient className="h-[350px]">
                        <CardHeader>
                            <CardTitle>Balance Distribution</CardTitle>
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
                            <CardTitle>Monthly Payments</CardTitle>
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
