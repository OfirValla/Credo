import { useState, useMemo } from 'react';
import { Calculator, Plus, RotateCcw, TrendingDown, Calendar, DollarSign, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useMortgage } from '@/context/MortgageProvider';
import { useMortgageCalculations } from '@/hooks/useMortgageCalculations';
import { formatCurrency } from '@/lib/currency';
import { ExtraPayment, RateChange } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

export function WhatIfSimulator() {
    const { plans, extraPayments: actualExtraPayments, rateChanges: actualRateChanges, gracePeriods, currency } = useMortgage();

    // --- Local State for Simulation ---
    const [simulatedExtraPayments, setSimulatedExtraPayments] = useState<ExtraPayment[]>([]);
    const [simulatedRateChanges, setSimulatedRateChanges] = useState<RateChange[]>([]);

    // --- Calculations ---
    // 1. Actual Scenario
    const actualSchedule = useMortgageCalculations(plans, actualExtraPayments, actualRateChanges, gracePeriods, currency);

    // 2. Simulated Scenario (Actual + Simulated inputs)
    const combinedExtraPayments = useMemo(() => [...actualExtraPayments, ...simulatedExtraPayments], [actualExtraPayments, simulatedExtraPayments]);
    const combinedRateChanges = useMemo(() => [...actualRateChanges, ...simulatedRateChanges], [actualRateChanges, simulatedRateChanges]);

    const simulatedSchedule = useMortgageCalculations(plans, combinedExtraPayments, combinedRateChanges, gracePeriods, currency);

    // --- Metrics Helper ---
    const calculateMetrics = (schedule: typeof actualSchedule) => {
        if (schedule.length === 0) return { totalInterest: 0, totalPaid: 0, payoffDate: '-' };

        const totalInterest = schedule.reduce((sum, row) => sum + row.interest, 0);
        const totalPaid = schedule.reduce((sum, row) => sum + row.monthlyPayment, 0); // Note: monthlyPayment includes extra payments in the row data
        const lastRow = schedule[schedule.length - 1];
        const payoffDate = lastRow ? lastRow.month : '-';

        return { totalInterest, totalPaid, payoffDate };
    };

    const actualMetrics = calculateMetrics(actualSchedule);
    const simulatedMetrics = calculateMetrics(simulatedSchedule);

    const interestSavings = actualMetrics.totalInterest - simulatedMetrics.totalInterest;
    const monthsSaved = actualSchedule.length - simulatedSchedule.length;

    // --- Handlers ---
    const addSimulatedPayment = () => {
        const newPayment: ExtraPayment = {
            id: `sim-${Date.now()}`,
            planId: plans[0]?.id || '',
            amount: 10000,
            month: new Date().toLocaleDateString('en-GB', { month: '2-digit', year: 'numeric' }), // Default to current month
            type: 'reduceTerm',
            enabled: true
        };
        setSimulatedExtraPayments([...simulatedExtraPayments, newPayment]);
    };

    const resetSimulation = () => {
        setSimulatedExtraPayments([]);
        setSimulatedRateChanges([]);
    };

    const planOptions = useMemo(() => plans.map(p => ({
        value: p.id,
        label: p.name || `Plan ${p.id}`
    })), [plans]);

    return (
        <Card className="w-full relative overflow-hidden border-primary/20 bg-gradient-to-br from-card/50 to-background backdrop-blur-sm shadow-xl">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />

            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/10 shadow-sm">
                            <Calculator className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                                What-If Simulator
                                <Badge variant="secondary" className="text-xs font-normal bg-primary/10 text-primary hover:bg-primary/20">
                                    Beta
                                </Badge>
                            </CardTitle>
                            <CardDescription>Simulate scenarios to optimize your mortgage</CardDescription>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={resetSimulation}
                        className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                        disabled={simulatedExtraPayments.length === 0}
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="space-y-8">

                {/* Comparison Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20 shadow-sm overflow-hidden relative group">
                        <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-muted-foreground">Interest Savings</span>
                                <TrendingDown className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div className={`text-2xl font-bold tracking-tight ${interestSavings > 0 ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                                {formatCurrency(interestSavings, currency)}
                            </div>
                            {interestSavings > 0 && (
                                <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1 font-medium">
                                    projected savings
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20 shadow-sm overflow-hidden relative group">
                        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-muted-foreground">Time Saved</span>
                                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                                {monthsSaved} <span className="text-sm font-normal text-muted-foreground">months</span>
                            </div>
                            {monthsSaved > 0 && (
                                <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1 font-medium">
                                    earlier freedom
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20 shadow-sm overflow-hidden relative group">
                        <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-muted-foreground">New Payoff Date</span>
                                <Sparkles className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div className="text-2xl font-bold tracking-tight text-orange-600 dark:text-orange-400">
                                {simulatedMetrics.payoffDate}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                vs {actualMetrics.payoffDate}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Controls Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Simulated Actions</h3>
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                                {simulatedExtraPayments.length}
                            </Badge>
                        </div>
                        <Button onClick={addSimulatedPayment} size="sm" className="gap-1.5 h-8">
                            <Plus className="w-3.5 h-3.5" /> Add Payment
                        </Button>
                    </div>

                    <div className="space-y-3 min-h-[100px]">
                        <AnimatePresence mode="popLayout">
                            {simulatedExtraPayments.map((payment, index) => (
                                <motion.div
                                    key={payment.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="group relative grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-xl border bg-card/50 hover:bg-card hover:shadow-md transition-all duration-200"
                                >
                                    <div className="md:col-span-4 space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Target Plan</Label>
                                        <Select
                                            value={payment.planId}
                                            onValueChange={(val) => {
                                                const newPayments = [...simulatedExtraPayments];
                                                newPayments[index].planId = val;
                                                setSimulatedExtraPayments(newPayments);
                                            }}
                                            options={planOptions}
                                        />
                                    </div>

                                    <div className="md:col-span-4 space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Amount</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="number"
                                                value={payment.amount}
                                                onChange={(e) => {
                                                    const newPayments = [...simulatedExtraPayments];
                                                    newPayments[index].amount = Number(e.target.value);
                                                    setSimulatedExtraPayments(newPayments);
                                                }}
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-3 space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Date</Label>
                                        <Input
                                            value={payment.month}
                                            onChange={(e) => {
                                                const newPayments = [...simulatedExtraPayments];
                                                newPayments[index].month = e.target.value;
                                                setSimulatedExtraPayments(newPayments);
                                            }}
                                            placeholder="MM/YYYY"
                                        />
                                    </div>

                                    <div className="md:col-span-1 flex items-end justify-end pb-0.5">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                            onClick={() => {
                                                const newPayments = simulatedExtraPayments.filter((_, i) => i !== index);
                                                setSimulatedExtraPayments(newPayments);
                                            }}
                                        >
                                            <Plus className="w-4 h-4 rotate-45" />
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {simulatedExtraPayments.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl bg-muted/20"
                            >
                                <div className="p-3 bg-background rounded-full mb-3 shadow-sm">
                                    <Sparkles className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <h4 className="text-sm font-medium text-foreground">No simulations active</h4>
                                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                                    Add a payment to see how much you could save.
                                </p>
                                <Button variant="link" size="sm" onClick={addSimulatedPayment} className="mt-2 h-auto p-0 text-primary">
                                    Add your first simulation
                                </Button>
                            </motion.div>
                        )}
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}
