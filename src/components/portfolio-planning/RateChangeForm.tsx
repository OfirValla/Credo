import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Calendar, Percent, Plus, Trash2, ArrowRight, Pencil, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { RateChange } from '@/types';
import { getPlanDisplayName, parseDateToMonthIndex } from '@/lib/planUtils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { usePortfolios } from '@/context/PortfoliosContext';

import { usePlans } from '@/context/PlanProvider';

export function RateChangeForm() {
  const { t } = useTranslation('portfolio-page');
  const { plans, currency, rateChanges, addRateChange, updateRateChange, deleteRateChange } = usePlans();
  const onAddRateChange = addRateChange;
  const onUpdateRateChange = updateRateChange;
  const onDeleteRateChange = deleteRateChange;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [month, setMonth] = useState('');
  const [planId, setPlanId] = useState('');
  const [newAnnualRate, setNewAnnualRate] = useState('');

  const { portfolioId } = useParams<{ portfolioId: string }>();
  const { portfolios } = usePortfolios();
  const currentPortfolio = portfolios.find(p => p.id === portfolioId);
  const isLoanPortfolio = currentPortfolio?.type === 'loan';

  // Auto-set planId for Loan portfolios or if only 1 plan exists
  useEffect(() => {
    if ((isLoanPortfolio || plans.length === 1) && !planId && plans.length > 0) {
      setPlanId(plans[0].id);
    }
  }, [isLoanPortfolio, plans, planId]);

  const handleEdit = (rateChange: RateChange) => {
    setEditingId(rateChange.id);
    setMonth(rateChange.month);
    setPlanId(rateChange.planId);
    setNewAnnualRate(rateChange.newAnnualRate.toString());
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setMonth('');
    // Keep planId if loan/single plan
    if (!isLoanPortfolio && plans.length !== 1) {
      setPlanId('');
    }
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
      toast.error(t('planning.rates.errors.month'));
      return;
    }

    // Validate rate
    const rate = parseFloat(newAnnualRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error(t('planning.rates.errors.rate'));
      return;
    }

    const rateChangeData = {
      month,
      planId,
      newAnnualRate: rate,
      enabled: true,
    };

    if (editingId) {
      onUpdateRateChange({ ...rateChangeData, id: editingId });
      setEditingId(null);
    } else {
      onAddRateChange(rateChangeData);
    }

    // Reset form
    setMonth('');
    // Keep planId if loan/single plan
    if (!isLoanPortfolio && plans.length !== 1) {
      setPlanId('');
    }
    setNewAnnualRate('');
  };

  const planOptions = plans.map(plan => ({
    value: plan.id,
    label: getPlanDisplayName(plan, currency)
  }));

  const showPlanSelect = !isLoanPortfolio && plans.length > 1;

  return (
    <Card gradient>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500 rounded-xl shadow-lg shadow-amber-500/20">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">
              {editingId ? t('planning.rates.editTitle') : t('planning.rates.title')}
            </CardTitle>
            <CardDescription>
              {t('planning.rates.description')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {showPlanSelect && (
              <div className="space-y-2">
                <Label htmlFor="rate-plan" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('planning.rates.form.targetPlan')}</Label>
                <Select
                  value={planId}
                  onValueChange={setPlanId}
                  options={planOptions}
                  placeholder={t('planning.extra.form.selectPlan')}
                  className="w-full"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rate-month" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('planning.rates.form.effectiveMonth')}</Label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <DateInput
                    id="rate-month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    placeholder="MM/YYYY"
                    format="MM/YYYY"
                    className="pl-9 bg-background/50 border-border/50 focus:ring-accent/20"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-rate" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('planning.rates.form.newRate')}</Label>
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
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
            >
              {editingId ? (
                <>
                  <Pencil className="w-4 h-4 mr-2" />
                  {t('planning.rates.form.update')}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('planning.rates.form.add')}
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
          <h3 className="text-sm font-medium text-muted-foreground">{t('planning.rates.list.title')}</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {rateChanges.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border/50 rounded-lg"
                >
                  {t('planning.rates.list.empty')}
                </motion.div>
              ) : (
                rateChanges.sort((a, b) => parseDateToMonthIndex(a.month) - parseDateToMonthIndex(b.month)).map((rateChange) => {
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
                        : rateChange.enabled === false
                          ? 'bg-muted/30 border-muted-foreground/20 opacity-60'
                          : 'bg-background/40 border-border/50 hover:bg-background/60'
                        }`}
                    >
                      <div className="space-y-1">
                        <div className='flex items-center gap-2'>
                          <span className={`flex items-center gap-2 font-medium text-sm ${rateChange.enabled === false ? 'line-through text-muted-foreground' : ''}`}>
                            <span className={rateChange.enabled === false ? 'text-muted-foreground' : 'text-amber-500'}>{rateChange.newAnnualRate}%</span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            <span>{rateChange.month}</span>
                          </span>
                          {rateChange.enabled === false && (
                            <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded no-underline">{t('planning.plans.list.disabled')}</span>
                          )}
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
                          className={`h-8 w-8 ${rateChange.enabled !== false
                            ? 'text-amber-500 hover:text-amber-500 hover:bg-amber-500/10'
                            : 'text-muted-foreground hover:text-muted-foreground hover:bg-muted/10'
                            }`}
                          onClick={() => {
                            onUpdateRateChange({
                              ...rateChange,
                              enabled: rateChange.enabled === false ? true : false,
                            });
                          }}
                          title={rateChange.enabled === false ? t('planning.extra.list.enable') : t('planning.extra.list.disable')}
                        >
                          {rateChange.enabled !== false ? (
                            <ToggleRight className="h-5 w-5" />
                          ) : (
                            <ToggleLeft className="h-5 w-5" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
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
