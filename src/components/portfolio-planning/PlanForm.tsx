import { useState } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Home, Calendar, DollarSign, Percent, Pencil, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { LoanType, Plan } from '@/types';
import { getCurrencySymbol } from '@/lib/currency';
import { getPlanDisplayName, getPlanDurationInfo } from '@/lib/planUtils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SlidingSelect } from '@/components/ui/sliding-select';
import { useTranslation } from 'react-i18next';

import { usePlans } from '@/context/PlanProvider';
import { useParams } from 'react-router';
import { usePortfolios } from '@/context/PortfoliosContext';

export function PlanForm() {
  const { t } = useTranslation('portfolio-page');
  const { plans, currency, addPlan, updatePlan, deletePlan } = usePlans();
  const onAddPlan = addPlan;
  const onUpdatePlan = updatePlan;
  const onDeletePlan = deletePlan;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [takenDate, setTakenDate] = useState('');
  const [firstPaymentDate, setFirstPaymentDate] = useState('');
  const [lastPaymentDate, setLastPaymentDate] = useState('');
  const [linkedToCPI, setLinkedToCPI] = useState(false);
  const [balloonValue, setBalloonValue] = useState('');
  const [loanType, setLoanType] = useState<LoanType>(LoanType.REGULAR);

  const { portfolioId } = useParams<{ portfolioId: string }>();
  const { portfolios } = usePortfolios();
  const currentPortfolio = portfolios.find(p => p.id === portfolioId);
  const isLoanPortfolio = currentPortfolio?.type === 'loan';

  const currencySymbol = getCurrencySymbol(currency);

  const handleEdit = (plan: Plan) => {
    setEditingId(plan.id);
    setName(plan.name || '');
    setAmount(plan.amount.toString());
    setInterestRate(plan.interestRate.toString());
    setTakenDate(plan.takenDate);
    setFirstPaymentDate(plan.firstPaymentDate);
    setLastPaymentDate(plan.lastPaymentDate);
    setLinkedToCPI(plan.linkedToCPI || false);
    setBalloonValue(plan.balloonValue?.toString() || '');
    setLoanType(plan.type || LoanType.REGULAR);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setAmount('');
    setInterestRate('');
    setTakenDate('');
    setFirstPaymentDate('');
    setLastPaymentDate('');
    setLinkedToCPI(false);
    setBalloonValue('');
    setLoanType(LoanType.REGULAR);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !interestRate || !takenDate || !firstPaymentDate || !lastPaymentDate) {
      return;
    }

    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    if (!dateRegex.test(takenDate) || !dateRegex.test(firstPaymentDate) || !dateRegex.test(lastPaymentDate)) {
      toast.error(t('planning.plans.errors.date'));
      return;
    }

    const planData = {
      name: name.trim() || undefined,
      amount: parseFloat(amount),
      interestRate: parseFloat(interestRate),
      takenDate,
      firstPaymentDate,
      lastPaymentDate,
      linkedToCPI,
      balloonValue: balloonValue ? parseFloat(balloonValue) : undefined,
      type: loanType,
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
    setAmount('');
    setInterestRate('');
    setTakenDate('');
    setFirstPaymentDate('');
    setLastPaymentDate('');
    setLinkedToCPI(false);
    setBalloonValue('');
    setLoanType(LoanType.REGULAR);
  };

  return (
    <Card gradient>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
            <Home className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">
              {editingId ? t('planning.plans.editTitle') : t('planning.plans.title')}
            </CardTitle>
            <CardDescription>
              {t('planning.plans.description')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="planName" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('planning.plans.form.name')}</Label>
              <Input
                id="planName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('planning.plans.form.namePlaceholder')}
                className="bg-background/50 border-border/50 focus:ring-primary/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('planning.plans.form.amount')} ({currencySymbol})</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={t('planning.plans.form.amountPlaceholder')}
                    className="pl-9 bg-background/50 border-border/50 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="interestRate" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('planning.plans.form.rate')}</Label>
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
                <Label htmlFor="takenDate" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('planning.plans.form.takenDate')}</Label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <DateInput
                    id="takenDate"
                    value={takenDate}
                    onChange={(e) => setTakenDate(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    format="DD/MM/YYYY"
                    className="pl-9 bg-background/50 border-border/50 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstPaymentDate" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('planning.plans.form.firstPayment')}</Label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <DateInput
                    id="firstPaymentDate"
                    value={firstPaymentDate}
                    onChange={(e) => setFirstPaymentDate(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    format="DD/MM/YYYY"
                    className="pl-9 bg-background/50 border-border/50 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastPaymentDate" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('planning.plans.form.lastPayment')}</Label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <DateInput
                    id="lastPaymentDate"
                    value={lastPaymentDate}
                    onChange={(e) => setLastPaymentDate(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    format="DD/MM/YYYY"
                    className="pl-9 bg-background/50 border-border/50 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2 gap-3">
              <Switch
                id="linkedToCPI"
                checked={linkedToCPI}
                onCheckedChange={setLinkedToCPI}
              />
              <Label htmlFor="linkedToCPI" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground">
                {t('planning.plans.form.linkCPI')}
              </Label>
            </div>

            {isLoanPortfolio && (
              <div className="pt-2 border-t border-border/50 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('planning.plans.form.structure')}</Label>
                  <SlidingSelect
                    value={loanType}
                    onValueChange={(e) => setLoanType(e as LoanType)}
                    options={[
                      { value: LoanType.REGULAR, label: t('planning.plans.form.structures.regular') },
                      { value: LoanType.BALLOON, label: t('planning.plans.form.structures.balloon') },
                    ]}
                    color="bg-primary"
                    textColor="text-primary-foreground"
                  />
                </div>

                {loanType === LoanType.BALLOON && (
                  <div className="space-y-2">
                    <Label htmlFor="balloonValue" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('planning.plans.form.balloonAmount')} ({currencySymbol})</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="balloonValue"
                        type="number"
                        step="0.01"
                        value={balloonValue}
                        onChange={(e) => setBalloonValue(e.target.value)}
                        placeholder="100000"
                        className="pl-9 bg-background/50 border-border/50 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
              {editingId ? (
                <>
                  <Pencil className="w-4 h-4 mr-2" />
                  {t('planning.plans.form.update')}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('planning.plans.form.add')}
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

        <h3 className="text-sm font-medium text-muted-foreground">{t('planning.plans.list.title')}</h3>
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {plans.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border/50 rounded-lg"
              >
                {t('planning.plans.list.empty')}
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
                      <div className={`font-medium text-sm ${!plan.enabled ? 'line-through text-muted-foreground' : ''}`}>
                        {getPlanDisplayName(plan, currency)}
                      </div>
                      {plan.enabled === false && (
                        <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded no-underline">{t('planning.plans.list.disabled')}</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-medium">
                        {plan.interestRate}%
                      </span>
                      <span>{plan.firstPaymentDate} - {plan.lastPaymentDate}</span>
                      <span>•</span>
                      {(() => {
                        const { totalMonths } = getPlanDurationInfo(plan);
                        return <>
                          <span>{`${totalMonths} ${t('planning.plans.list.totalMonths')}`}</span>
                          <span>•</span>
                          <span>{`${plan.remainingMonths ?? 0} ${t('planning.plans.list.remainingMonths')}`}</span>
                        </>;
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${plan.enabled !== false ? 'text-secondary hover:text-secondary hover:bg-secondary/10' : 'text-muted-foreground hover:text-muted-foreground hover:bg-muted/10'}`}
                      onClick={() => onUpdatePlan({ ...plan, enabled: !plan.enabled })}
                      title={plan.enabled !== false ? t('planning.plans.list.enable') : t('planning.plans.list.disable')}
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
      </CardContent >
    </Card >
  );
}
