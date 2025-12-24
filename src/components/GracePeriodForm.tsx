import { motion, AnimatePresence } from 'framer-motion';
import { Hourglass, CalendarClock, Plus, Trash2, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateInput } from '@/components/ui/date-input';
import { SlidingSelect } from '@/components/ui/sliding-select';
import { Label } from '@/components/ui/label';
import { usePlans } from '@/context/PlanProvider';
import { getPlanDisplayName } from '@/lib/planUtils';
import { parseDateToMonthIndex } from '@/lib/planUtils';
import { useState } from 'react';
import { GracePeriod } from '@/types';

export function GracePeriodForm() {
    const { plans, currency, updatePlan, gracePeriods, addGracePeriod, deleteGracePeriod, updateGracePeriod } = usePlans();
    const [isAdding, setIsAdding] = useState<string | null>(null); // planId if adding
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<GracePeriod>>({});
    const [newGracePeriod, setNewGracePeriod] = useState<Partial<GracePeriod>>({
        type: 'capitalized',
        startDate: '',
        endDate: ''
    });

    // Filter only enabled plans
    const activePlans = plans.filter(p => p.enabled !== false);

    const calculateGracePeriodMonths = (takenDate: string, firstPaymentDate: string) => {
        const start = parseDateToMonthIndex(takenDate);
        const end = parseDateToMonthIndex(firstPaymentDate);
        return Math.max(0, Math.floor(end - start));
    };

    const handleAddGracePeriod = (planId: string) => {
        if (!newGracePeriod.startDate || !newGracePeriod.endDate) return;

        addGracePeriod({
            planId,
            startDate: newGracePeriod.startDate!,
            endDate: newGracePeriod.endDate!,
            type: newGracePeriod.type as 'capitalized' | 'interestOnly' || 'capitalized',
            enabled: true
        });

        setIsAdding(null);
        setNewGracePeriod({
            type: 'capitalized',
            startDate: '',
            endDate: ''
        });
    };

    const handleEditStart = (gp: GracePeriod) => {
        setEditingId(gp.id);
        setEditForm(gp);
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleEditSave = () => {
        if (!editingId || !editForm.startDate || !editForm.endDate) return;

        updateGracePeriod({
            ...editForm as GracePeriod,
            id: editingId
        });

        setEditingId(null);
        setEditForm({});
    };

    const handleToggle = (gp: GracePeriod) => {
        updateGracePeriod({
            ...gp,
            enabled: !gp.enabled
        });
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
                                const planGracePeriods = gracePeriods.filter(gp => gp.planId === plan.id);

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
                                                <div className="rounded-md border border-indigo-100 bg-indigo-50/50 p-3 space-y-3 dark:bg-indigo-950/20 dark:border-indigo-900/50">
                                                    <div className="flex items-center justify-between">
                                                        <Label htmlFor={`grace-type-${plan.id}`} className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                                                            <Hourglass className="w-3 h-3" />
                                                            Initial Grace Period
                                                        </Label>
                                                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium dark:bg-indigo-900/50 dark:text-indigo-300">
                                                            Default
                                                        </span>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="relative">
                                                            <SlidingSelect
                                                                value={plan.gracePeriodType || 'capitalized'}
                                                                onValueChange={(value: string) => updatePlan({ ...plan, gracePeriodType: value as 'capitalized' | 'interestOnly' })}
                                                                options={[
                                                                    { value: 'capitalized', label: 'Capitalized (Add to Principal)' },
                                                                    { value: 'interestOnly', label: 'Interest Only (Pay Monthly)' },
                                                                ]}
                                                                color="bg-indigo-500"
                                                                textColor="text-primary-foreground"
                                                            />
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground pl-1 flex items-center gap-1.5">
                                                            <span className="mt-0.5 block w-1 h-1 rounded-full bg-indigo-400 shrink-0" />
                                                            {plan.gracePeriodType === 'interestOnly'
                                                                ? 'You pay the accrued interest each month. Principal remains same.'
                                                                : 'Interest is added to your loan balance. No monthly payments.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-3 rounded-md border border-dashed border-muted-foreground/20 bg-muted/30 text-xs text-muted-foreground italic text-center">
                                                    No initial grace period (First payment is immediately after taken date)
                                                </div>
                                            )}

                                            {/* Additional Grace Periods */}
                                            <div className="space-y-3 pt-2 border-t border-border/50">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                        Additional Grace Periods
                                                    </Label>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 text-xs"
                                                        onClick={() => setIsAdding(isAdding === plan.id ? null : plan.id)}
                                                    >
                                                        <Plus className="w-3 h-3 mr-1" />
                                                        Add Period
                                                    </Button>
                                                </div>

                                                <div className="space-y-2">
                                                    {planGracePeriods.sort((a, b) => parseDateToMonthIndex(a.startDate) - parseDateToMonthIndex(b.startDate)).map(gp => (
                                                        <div key={gp.id} className={`flex items-center justify-between p-2 bg-background/50 rounded border border-border/50 text-sm ${gp.enabled === false ? 'opacity-60' : ''}`}>
                                                            {editingId === gp.id ? (
                                                                <div className="flex-1 p-2 bg-background rounded-md shadow-sm border border-indigo-100 dark:border-indigo-900/50">
                                                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                                                        <div className="space-y-1.5">
                                                                            <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Start Date</Label>
                                                                            <DateInput
                                                                                value={editForm.startDate || ''}
                                                                                onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                                                                                placeholder="MM/YYYY"
                                                                                format="MM/YYYY"
                                                                                className="h-8 text-xs bg-muted/30"
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-1.5">
                                                                            <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">End Date</Label>
                                                                            <DateInput
                                                                                value={editForm.endDate || ''}
                                                                                onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                                                                                placeholder="MM/YYYY"
                                                                                format="MM/YYYY"
                                                                                className="h-8 text-xs bg-muted/30"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-1.5 mb-3">
                                                                        <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Type</Label>
                                                                        <div className="relative">
                                                                            <SlidingSelect
                                                                                value={editForm.type!}
                                                                                onValueChange={(value: string) => setEditForm({ ...editForm, type: value as "capitalized" | "interestOnly" })}
                                                                                options={[
                                                                                    { value: 'capitalized', label: 'Capitalized' },
                                                                                    { value: 'interestOnly', label: 'Interest Only' },
                                                                                ]}
                                                                                color="bg-indigo-500"
                                                                                textColor="text-primary-foreground"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-2 justify-end pt-2 border-t border-border/50">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-7 text-xs hover:bg-destructive/10 hover:text-destructive"
                                                                            onClick={handleEditCancel}
                                                                        >
                                                                            Cancel
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                                                                            onClick={handleEditSave}
                                                                        >
                                                                            Save Changes
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium flex items-center gap-2">
                                                                            {gp.startDate} - {gp.endDate}
                                                                            {gp.enabled === false && <span className="text-[10px] uppercase bg-muted px-1 rounded">Disabled</span>}
                                                                        </span>
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {gp.type === 'interestOnly' ? 'Interest Only' : 'Capitalized'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className={`h-6 w-6 ${gp.enabled !== false ? 'text-secondary hover:text-secondary hover:bg-secondary/10' : 'text-muted-foreground hover:text-muted-foreground hover:bg-muted/10'}`}
                                                                            onClick={() => handleToggle(gp)}
                                                                            title={gp.enabled !== false ? "Disable" : "Enable"}
                                                                        >
                                                                            {gp.enabled !== false ? (
                                                                                <ToggleRight className="w-4 h-4" />
                                                                            ) : (
                                                                                <ToggleLeft className="w-4 h-4" />
                                                                            )}
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                                                            onClick={() => handleEditStart(gp)}
                                                                        >
                                                                            <Pencil className="w-3 h-3" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                            onClick={() => deleteGracePeriod(gp.id)}
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </Button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    ))}

                                                    {isAdding === plan.id && (
                                                        <div className="p-3 bg-muted/30 rounded border border-border/50 space-y-3 animate-in fade-in slide-in-from-top-2">
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs">Start (MM/YYYY)</Label>
                                                                    <DateInput
                                                                        value={newGracePeriod.startDate || ''}
                                                                        onChange={(e) => setNewGracePeriod({ ...newGracePeriod, startDate: e.target.value })}
                                                                        placeholder="MM/YYYY"
                                                                        format="MM/YYYY"
                                                                        className="h-8 text-xs"
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs">End (MM/YYYY)</Label>
                                                                    <DateInput
                                                                        value={newGracePeriod.endDate || ''}
                                                                        onChange={(e) => setNewGracePeriod({ ...newGracePeriod, endDate: e.target.value })}
                                                                        placeholder="MM/YYYY"
                                                                        format="MM/YYYY"
                                                                        className="h-8 text-xs"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">Type</Label>
                                                                <div className="relative">
                                                                    <SlidingSelect
                                                                        value={newGracePeriod.type || 'capitalized'}
                                                                        onValueChange={(value: string) => setNewGracePeriod({ ...newGracePeriod, type: value as 'capitalized' | 'interestOnly' })}
                                                                        options={[
                                                                            { value: 'capitalized', label: 'Capitalized' },
                                                                            { value: 'interestOnly', label: 'Interest Only' },
                                                                        ]}
                                                                        color="bg-indigo-500"
                                                                        textColor="text-primary-foreground"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-7 text-xs"
                                                                    onClick={() => setIsAdding(null)}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    className="h-7 text-xs"
                                                                    onClick={() => handleAddGracePeriod(plan.id)}
                                                                    disabled={!newGracePeriod.startDate || !newGracePeriod.endDate}
                                                                >
                                                                    Add
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
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
