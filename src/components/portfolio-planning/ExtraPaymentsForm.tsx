import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Calendar, DollarSign, Plus, Trash2, ArrowRight, Pencil, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { ExtraPayment, ExtraPaymentType } from '@/types';
import { getCurrencySymbol, formatCurrency } from '@/lib/currency';
import { getPlanDisplayName, parseDateToMonthIndex } from '@/lib/planUtils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { SlidingSelect } from '@/components/ui/sliding-select';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { usePortfolios } from '@/context/PortfoliosContext';

import { usePlans } from '@/context/PlanProvider';

export function ExtraPaymentsForm() {
  const { t } = useTranslation('portfolio-page');
  const { plans, currency, extraPayments, addExtraPayment, updateExtraPayment, deleteExtraPayment } = usePlans();
  const onAddExtraPayment = addExtraPayment;
  const onUpdateExtraPayment = updateExtraPayment;
  const onDeleteExtraPayment = deleteExtraPayment;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [month, setMonth] = useState('');
  const [planId, setPlanId] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<ExtraPaymentType>(ExtraPaymentType.REDUCE_TERM);

  const { portfolioId } = useParams<{ portfolioId: string }>();
  const { portfolios } = usePortfolios();
  const currentPortfolio = portfolios.find(p => p.id === portfolioId);
  const isLoanPortfolio = currentPortfolio?.type === 'loan';

  const currencySymbol = getCurrencySymbol(currency);

  // Auto-set planId for Loan portfolios or if only 1 plan exists
  useEffect(() => {
    if ((isLoanPortfolio || plans.length === 1) && !planId && plans.length > 0) {
      setPlanId(plans[0].id);
    }
  }, [isLoanPortfolio, plans, planId]);

  const handleEdit = (payment: ExtraPayment) => {
    setEditingId(payment.id);
    setMonth(payment.month);
    setPlanId(payment.planId);
    setAmount(payment.amount.toString());
    setType(payment.type);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setMonth('');
    // Keep planId if loan/single plan
    if (!isLoanPortfolio && plans.length !== 1) {
      setPlanId('');
    }
    setAmount('');
    setType(ExtraPaymentType.REDUCE_TERM);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!month || !planId || !amount) {
      return;
    }

    const dateRegex = /^(0[1-9]|1[0-2])\/\d{4}$/;
    if (!dateRegex.test(month)) {
      toast.error(t('planning.extra.errors.month'));
      return;
    }

    const paymentData = {
      month,
      planId,
      amount: parseFloat(amount),
      type,
      enabled: true, // New payments are enabled by default
    };

    if (editingId) {
      onUpdateExtraPayment({ ...paymentData, id: editingId });
      setEditingId(null);
    } else {
      onAddExtraPayment(paymentData);
    }

    setMonth('');
    // Keep planId if loan/single plan
    if (!isLoanPortfolio && plans.length !== 1) {
      setPlanId('');
    }
    setAmount('');
    setType(ExtraPaymentType.REDUCE_TERM);
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
          <div className="p-3 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">
              {editingId ? t('planning.extra.editTitle') : t('planning.extra.title')}
            </CardTitle>
            <CardDescription>
              {t('planning.extra.description')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {showPlanSelect && (
              <div className="space-y-2">
                <Label htmlFor="plan" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('planning.extra.form.targetPlan')}</Label>
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
                <Label htmlFor="month" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('planning.extra.form.month')}</Label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <DateInput
                    id="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    placeholder="MM/YYYY"
                    format="MM/YYYY"
                    className="pl-9 bg-background/50 border-border/50 focus:ring-secondary/20"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('planning.extra.form.amount')} ({currencySymbol})</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="500"
                    className="pl-9 bg-background/50 border-border/50 focus:ring-secondary/20"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('planning.extra.form.strategy')}</Label>
              <SlidingSelect
                value={type}
                onValueChange={(e) => setType(e as ExtraPaymentType)}
                options={[
                  { value: ExtraPaymentType.REDUCE_TERM, label: t('planning.extra.form.strategies.reduceTerm') },
                  { value: ExtraPaymentType.REDUCE_PAYMENT, label: t('planning.extra.form.strategies.reducePayment') },
                ]}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={plans.length === 0}
                className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg shadow-secondary/20 transition-all hover:scale-[1.02]"
              >
                {editingId ? (
                  <>
                    <Pencil className="w-4 h-4 mr-2" />
                    {t('planning.extra.form.update')}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('planning.extra.form.add')}
                  </>
                )}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={handleCancelEdit} className="px-3">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </form>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">{t('planning.extra.list.title')}</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {extraPayments.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border/50 rounded-lg"
                >
                  {t('planning.extra.list.empty')}
                </motion.div>
              ) : (
                extraPayments.sort((a, b) => parseDateToMonthIndex(a.month) - parseDateToMonthIndex(b.month)).map((payment) => {
                  const plan = plans.find((p) => p.id === payment.planId);
                  return (
                    <motion.div
                      key={payment.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      layout
                      className={`group flex items-center justify-between p-3 border rounded-lg transition-colors ${editingId === payment.id
                        ? 'bg-secondary/10 border-secondary/50'
                        : payment.enabled === false
                          ? 'bg-muted/30 border-muted-foreground/20 opacity-60'
                          : 'bg-background/40 border-border/50 hover:bg-background/60'
                        }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="space-y-1 flex-1">
                          <div className='flex items-center gap-2'>
                            <span className={`flex items-center gap-2 font-medium text-sm ${payment.enabled === false ? 'line-through text-muted-foreground' : ''}`}>
                              <span className={payment.enabled === false ? 'text-muted-foreground' : 'text-secondary'}>
                                {formatCurrency(payment.amount, currency)}
                              </span>
                              <ArrowRight className="w-3 h-3 text-muted-foreground" />
                              <span>{payment.month}</span>
                            </span>
                            {payment.enabled === false && (
                              <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded no-underline">{t('planning.plans.list.disabled')}</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {plan ? getPlanDisplayName(plan, currency) : 'Unknown Plan'} • {payment.type === 'reduceTerm' ? t('planning.extra.list.term') : t('planning.extra.list.payment')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${payment.enabled !== false
                            ? 'text-secondary hover:text-secondary hover:bg-secondary/10'
                            : 'text-muted-foreground hover:text-muted-foreground hover:bg-muted/10'
                            }`}
                          onClick={() => {
                            onUpdateExtraPayment({
                              ...payment,
                              enabled: payment.enabled === false ? true : false,
                            });
                          }}
                          title={payment.enabled === false ? t('planning.extra.list.enable') : t('planning.extra.list.disable')}
                        >
                          {payment.enabled !== false ? (
                            <ToggleRight className="h-5 w-5" />
                          ) : (
                            <ToggleLeft className="h-5 w-5" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-secondary hover:bg-secondary/10"
                          onClick={() => handleEdit(payment)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => onDeleteExtraPayment(payment.id)}
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
