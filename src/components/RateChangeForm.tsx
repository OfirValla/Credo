import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Calendar, Percent, Plus, Trash2, ArrowRight, Pencil, X } from 'lucide-react';
import { RateChange, MortgagePlan } from '@/types';
import { CurrencyCode } from '@/lib/currency';
import { getPlanDisplayName } from '@/lib/planUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/custom-select';

interface RateChangeFormProps {
  plans: MortgagePlan[];
  currency: CurrencyCode;
  rateChanges: RateChange[];
  onAddRateChange: (rateChange: Omit<RateChange, 'id'>) => void;
  onUpdateRateChange: (rateChange: RateChange) => void;
  onDeleteRateChange: (id: string) => void;
}

export function RateChangeForm({
  plans,
  currency,
  rateChanges,
  onAddRateChange,
  onUpdateRateChange,
  onDeleteRateChange,
}: RateChangeFormProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [month, setMonth] = useState('');
  const [planId, setPlanId] = useState('');
  const [newAnnualRate, setNewAnnualRate] = useState('');

  const handleEdit = (rateChange: RateChange) => {
    setEditingId(rateChange.id);
    setMonth(rateChange.month);
    setPlanId(rateChange.planId);
    setNewAnnualRate(rateChange.newAnnualRate.toString());
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setMonth('');
    setPlanId('');
    setNewAnnualRate('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!month || !planId || !newAnnualRate) {
      return;
    }

    // Validate date format (MM/YYYY)
    const dateRegex = /^(0[1-9]|1[0-2])\/\d{4}$/;
    if (!dateRegex.test(month)) {
      alert('Month must be in MM/YYYY format (e.g., 01/2024)');
      return;
    }

    // Validate rate
    const rate = parseFloat(newAnnualRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      alert('Annual rate must be a number between 0 and 100');
      return;
    }

    const rateChangeData = {
      month,
      planId,
      newAnnualRate: rate,
    };

    if (editingId) {
      onUpdateRateChange({ ...rateChangeData, id: editingId });
      setEditingId(null);
    } else {
      onAddRateChange(rateChangeData);
    }

    // Reset form
    setMonth('');
    setPlanId('');
    setNewAnnualRate('');
  };

  const planOptions = plans.map(plan => ({
    value: plan.id,
    label: getPlanDisplayName(plan, currency)
  }));

  return (
    <Card className="glass-card border-none overflow-hidden">
      <CardHeader className="bg-accent/5 border-b border-border/50">
        <CardTitle className="flex items-center gap-2 text-xl">
          <TrendingUp className="w-5 h-5 text-accent" />
          {editingId ? 'Edit Rate Change' : 'Interest Rate Changes'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rate-plan" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Target Plan</Label>
              <Select
                value={planId}
                onValueChange={setPlanId}
                options={planOptions}
                placeholder="Select a plan..."
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rate-month" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Effective Month</Label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="rate-month"
                    type="text"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    placeholder="MM/YYYY"
                    pattern="(0[1-9]|1[0-2])\/\d{4}"
                    className="pl-9 bg-background/50 border-border/50 focus:ring-accent/20"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-rate" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">New Rate (%)</Label>
                <div className="relative">
                  <Percent className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-rate"
                    type="number"
                    step="0.001"
                    value={newAnnualRate}
                    onChange={(e) => setNewAnnualRate(e.target.value)}
                    placeholder="5.5"
                    min="0"
                    max="100"
                    className="pl-9 bg-background/50 border-border/50 focus:ring-accent/20"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={plans.length === 0}
              className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/20 transition-all hover:scale-[1.02]"
            >
              {editingId ? (
                <>
                  <Pencil className="w-4 h-4 mr-2" />
                  Update Rate Change
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Rate Change
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
          <h3 className="text-sm font-medium text-muted-foreground">Scheduled Changes</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {rateChanges.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border/50 rounded-lg"
                >
                  No rate changes scheduled
                </motion.div>
              ) : (
                rateChanges.map((rateChange) => {
                  const plan = plans.find((p) => p.id === rateChange.planId);
                  return (
                    <motion.div
                      key={rateChange.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      layout
                      className={`group flex items-center justify-between p-3 border rounded-lg transition-colors ${editingId === rateChange.id
                        ? 'bg-accent/10 border-accent/50'
                        : 'bg-background/40 border-border/50 hover:bg-background/60'
                        }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-medium text-sm">
                          <span className="text-accent">{rateChange.newAnnualRate}%</span>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <span>{rateChange.month}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {plan ? getPlanDisplayName(plan, currency) : 'Unknown Plan'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-accent hover:bg-accent/10"
                          onClick={() => handleEdit(rateChange)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => onDeleteRateChange(rateChange.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
