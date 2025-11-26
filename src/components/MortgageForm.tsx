import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Home, Calendar, DollarSign, Percent, Pencil, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { MortgagePlan } from '@/types';
import { CurrencyCode, getCurrencySymbol } from '@/lib/currency';
import { getPlanDisplayName, getPlanDurationInfo } from '@/lib/planUtils';
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
  const [amount, setAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [takenDate, setTakenDate] = useState('');
  const [firstPaymentDate, setFirstPaymentDate] = useState('');
  const [lastPaymentDate, setLastPaymentDate] = useState('');

  const currencySymbol = getCurrencySymbol(currency);

  const handleEdit = (plan: MortgagePlan) => {
    setEditingId(plan.id);
    setName(plan.name || '');
    setAmount(plan.amount.toString());
    setInterestRate(plan.interestRate.toString());
    setTakenDate(plan.takenDate);
    setFirstPaymentDate(plan.firstPaymentDate);
    setLastPaymentDate(plan.lastPaymentDate);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setAmount('');
    setInterestRate('');
    setTakenDate('');
    setFirstPaymentDate('');
    setLastPaymentDate('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !interestRate || !takenDate || !firstPaymentDate || !lastPaymentDate) {
      return;
    }

    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    if (!dateRegex.test(takenDate) || !dateRegex.test(firstPaymentDate) || !dateRegex.test(lastPaymentDate)) {
      alert('Dates must be in DD/MM/YYYY format (e.g., 01/01/2024)');
      return;
    }

    const planData = {
      name: name.trim() || undefined,
      amount: parseFloat(amount),
      interestRate: parseFloat(interestRate),
      takenDate,
      firstPaymentDate,
      lastPaymentDate,
    };

    if (editingId) {
      const existingPlan = plans.find(p => p.id === editingId);
      if (existingPlan) {
        onUpdatePlan({ ...existingPlan, ...planData, id: editingId });
      }
      setEditingId(null);
    } else {
      onAddPlan(planData);
    }

    setName('');
    setName('');
    setAmount('');
    setInterestRate('');
    setTakenDate('');
    setFirstPaymentDate('');
    setLastPaymentDate('');
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
                <Label htmlFor="amount" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount ({currencySymbol})</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="300000"
                    className="pl-9 bg-background/50 border-border/50 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="interestRate" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Rate (%)</Label>
                <div className="relative">
                  <Percent className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.001"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="5.500"
                    className="pl-9 bg-background/50 border-border/50 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="takenDate" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Taken Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="takenDate"
                    value={takenDate}
                    onChange={(e) => setTakenDate(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="pl-9 bg-background/50 border-border/50 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstPaymentDate" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">First Payment</Label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="firstPaymentDate"
                    value={firstPaymentDate}
                    onChange={(e) => setFirstPaymentDate(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="pl-9 bg-background/50 border-border/50 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastPaymentDate" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Last Payment</Label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="lastPaymentDate"
                    value={lastPaymentDate}
                    onChange={(e) => setLastPaymentDate(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="pl-9 bg-background/50 border-border/50 focus:ring-primary/20"
                    required
                  />
                </div>
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
                      : plan.enabled === false
                        ? 'bg-muted/30 border-border/30 opacity-60'
                        : 'bg-background/40 border-border/50 hover:bg-background/60'
                      }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className={`font-medium text-sm ${plan.enabled === false ? 'line-through text-muted-foreground' : ''}`}>
                          {getPlanDisplayName(plan, currency)}
                        </div>
                        {plan.enabled === false && (
                          <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded no-underline">Disabled</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-medium">
                          {plan.interestRate}%
                        </span>
                        <span>{plan.firstPaymentDate} - {plan.lastPaymentDate}</span>
                        <span>•</span>
                        <span>
                          {(() => {
                            const { totalMonths, remainingMonths } = getPlanDurationInfo(plan);
                            return `${totalMonths} months total • ${Math.floor(remainingMonths)} months remaining`;
                          })()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${plan.enabled !== false ? 'text-secondary hover:text-secondary hover:bg-secondary/10' : 'text-muted-foreground hover:text-muted-foreground hover:bg-muted/10'}`}
                        onClick={() => onUpdatePlan({ ...plan, enabled: !plan.enabled })}
                        title={plan.enabled !== false ? 'Enable plan' : 'Disable plan'}
                      >
                        {plan.enabled ? (
                          <ToggleRight className="h-5 w-5" />
                        ) : (
                          <ToggleLeft className="h-5 w-5" />
                        )}
                      </Button>
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
