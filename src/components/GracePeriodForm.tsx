import { motion, AnimatePresence } from 'framer-motion';
import { Hourglass, CalendarClock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useMortgage } from '@/context/MortgageProvider';
import { getPlanDisplayName } from '@/lib/planUtils';
import { parseDateToMonthIndex } from '@/lib/planUtils';

export function GracePeriodForm() {
    const { plans, currency, updatePlan } = useMortgage();

    // Filter only enabled plans
    const activePlans = plans.filter(p => p.enabled !== false);

    const calculateGracePeriodMonths = (takenDate: string, firstPaymentDate: string) => {
        const start = parseDateToMonthIndex(takenDate);
        const end = parseDateToMonthIndex(firstPaymentDate);
        return Math.max(0, Math.floor(end - start));
    };

    return (
        <Card gradient>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
                        <Hourglass className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold">
                            Grace Periods
                        </CardTitle>
                        <CardDescription>
                            Manage interest settings before first payment
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {activePlans.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border/50 rounded-lg"
                            >
                                No active mortgage plans
                            </motion.div>
                        ) : (
                            activePlans.map((plan) => {
                                const months = calculateGracePeriodMonths(plan.takenDate, plan.firstPaymentDate);
                                const hasGracePeriod = months > 0;

                                return (
                                    <motion.div
                                        key={plan.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="group p-4 border rounded-lg bg-background/40 border-border/50 hover:bg-background/60 transition-colors"
                                    >
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center justify-between">
                                                <div className="font-medium text-sm">
                                                    {getPlanDisplayName(plan, currency)}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                                                    <CalendarClock className="w-3 h-3" />
                                                    <span>{months} months grace</span>
                                                </div>
                                            </div>

                                            {hasGracePeriod ? (
                                                <div className="space-y-2">
                                                    <Label htmlFor={`grace-type-${plan.id}`} className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                        Payment Type
                                                    </Label>
                                                    <div className="relative">
                                                        <select
                                                            id={`grace-type-${plan.id}`}
                                                            value={plan.gracePeriodType || 'capitalized'}
                                                            onChange={(e) => updatePlan({ ...plan, gracePeriodType: e.target.value as 'capitalized' | 'interestOnly' })}
                                                            className="w-full h-9 pl-3 pr-8 bg-background/50 border border-border/50 rounded-md focus:ring-indigo-500/20 text-sm appearance-none transition-colors hover:bg-background/80"
                                                        >
                                                            <option value="capitalized">Capitalized (Add to Principal)</option>
                                                            <option value="interestOnly">Interest Only (Pay Monthly)</option>
                                                        </select>
                                                        <div className="absolute right-3 top-2.5 pointer-events-none">
                                                            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground pl-1">
                                                        {plan.gracePeriodType === 'interestOnly'
                                                            ? 'You pay the accrued interest each month. Principal remains same.'
                                                            : 'Interest is added to your loan balance. No monthly payments.'}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-muted-foreground italic pl-1">
                                                    No grace period (First payment is immediately after taken date)
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </div>
            </CardContent>
        </Card>
    );
}
