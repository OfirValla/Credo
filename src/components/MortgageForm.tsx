import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Home, Calendar, DollarSign, Percent, Pencil, X } from 'lucide-react';
import { MortgagePlan } from '@/types';
import { CurrencyCode, getCurrencySymbol } from '@/lib/currency';
import { getPlanDisplayName } from '@/lib/planUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MortgageFormProps {
  plans: MortgagePlan[];
  currency: CurrencyCode;
  onAddPlan: (plan: Omit<MortgagePlan, 'id'>) => void;
  onUpdatePlan: (plan: MortgagePlan) => void;
  onDeletePlan: (id: string) => void;
}

export function MortgageForm({ plans, currency, onAddPlan, onUpdatePlan, onDeletePlan }: MortgageFormProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [annualRate, setAnnualRate] = useState('');
  const [termMonths, setTermMonths] = useState('');
  const [startDate, setStartDate] = useState('');

  const currencySymbol = getCurrencySymbol(currency);

  const handleEdit = (plan: MortgagePlan) => {
    setEditingId(plan.id);
    setName(plan.name || '');
    setInitialAmount(plan.initialAmount.toString());
    setAnnualRate(plan.annualRate.toString());
    setTermMonths(plan.termMonths.toString());
    setStartDate(plan.startDate);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setInitialAmount('');
    setAnnualRate('');
    setTermMonths('');
    setStartDate('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!initialAmount || !annualRate || !termMonths || !startDate) {
      return;
    }

    const dateRegex = /^(0[1-9]|1[0-2])\/\d{4}$/;
    if (!dateRegex.test(startDate)) {
      alert('Start date must be in MM/YYYY format (e.g., 01/2024)');
      return;
    }

    const planData = {
      name: name.trim() || undefined,
      initialAmount: parseFloat(initialAmount),
      annualRate: parseFloat(annualRate),
      termMonths: parseInt(termMonths),
      startDate,
    };

    if (editingId) {
      onUpdatePlan({ ...planData, id: editingId });
      setEditingId(null);
    } else {
      onAddPlan(planData);
    }

    setName('');
    setInitialAmount('');
    setAnnualRate('');
    setTermMonths('');
    setStartDate('');
  };

  return (
    <Card className="glass-card border-none overflow-hidden">
      <CardHeader className="bg-primary/5 border-b border-border/50">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Home className="w-5 h-5 text-primary" />
          {editingId ? 'Edit Mortgage Plan' : 'Mortgage Plans'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="planName" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Plan Name</Label>
              <Input
                id="planName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Primary Home"
                className="bg-background/50 border-border/50 focus:ring-primary/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="initialAmount" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount ({currencySymbol})</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="initialAmount"
                    type="number"
                    step="0.01"
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(e.target.value)}
                    placeholder="300000"
                    className="pl-9 bg-background/50 border-border/50 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="annualRate" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Rate (%)</Label>
                <div className="relative">
                  <Percent className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="annualRate"
                    type="number"
                    step="0.01"
                    value={annualRate}
                    onChange={(e) => setAnnualRate(e.target.value)}
                    placeholder="5.5"
                    className="pl-9 bg-background/50 border-border/50 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="termMonths" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Term (Months)</Label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="termMonths"
                    type="number"
                    value={termMonths}
                    onChange={(e) => setTermMonths(e.target.value)}
                    placeholder="360"
                    className="pl-9 bg-background/50 border-border/50 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Start Date</Label>
                <Input
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="MM/YYYY"
                  pattern="(0[1-9]|1[0-2])\/\d{4}"
                  className="bg-background/50 border-border/50 focus:ring-primary/20"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
              {editingId ? (
                <>
                  <Pencil className="w-4 h-4 mr-2" />
                  Update Plan
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Plan
                </>
              )}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={handleCancelEdit} className="px-3">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </form>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Current Plans</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {plans.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border/50 rounded-lg"
                >
                  No mortgage plans added yet
                </motion.div>
              ) : (
                plans.map((plan) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    layout
                    className={`group flex items-center justify-between p-3 border rounded-lg transition-colors ${editingId === plan.id
                        ? 'bg-primary/10 border-primary/50'
                        : 'bg-background/40 border-border/50 hover:bg-background/60'
                      }`}
                  >
                    <div className="space-y-1">
                      <div className="font-medium text-sm">
                        {getPlanDisplayName(plan, currency)}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-medium">
                          {plan.annualRate}%
                        </span>
                        <span>{plan.termMonths}mo</span>
                        <span>•</span>
                        <span>{plan.startDate}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        onClick={() => handleEdit(plan)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onDeletePlan(plan.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
