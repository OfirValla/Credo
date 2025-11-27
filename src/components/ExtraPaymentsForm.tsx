import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Calendar, DollarSign, Plus, Trash2, ArrowRight, Pencil, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { ExtraPayment } from '@/types';
import { getCurrencySymbol, formatCurrency } from '@/lib/currency';
import { getPlanDisplayName } from '@/lib/planUtils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

import { useMortgage } from '@/context/MortgageProvider';

export function ExtraPaymentsForm() {
  const { plans, currency, extraPayments, addExtraPayment, updateExtraPayment, deleteExtraPayment } = useMortgage();
  const onAddExtraPayment = addExtraPayment;
  const onUpdateExtraPayment = updateExtraPayment;
  const onDeleteExtraPayment = deleteExtraPayment;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [month, setMonth] = useState('');
  const [planId, setPlanId] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'reduceTerm' | 'reducePayment'>('reduceTerm');

  const currencySymbol = getCurrencySymbol(currency);

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
    setPlanId('');
    setAmount('');
    setType('reduceTerm');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!month || !planId || !amount) {
      return;
    }

    const dateRegex = /^(0[1-9]|1[0-2])\/\d{4}$/;
    if (!dateRegex.test(month)) {
      alert('Month must be in MM/YYYY format (e.g., 01/2024)');
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
    setPlanId('');
    setAmount('');
    setType('reduceTerm');
  };

  const planOptions = plans.map(plan => ({
    value: plan.id,
    label: getPlanDisplayName(plan, currency)
  }));

  return (
    <Card gradient>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold">
              {editingId ? 'Edit Extra Payment' : 'Extra Payments'}
            </CardTitle>
            <CardDescription>
              Make one-time payments to reduce your principal
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Target Plan</Label>
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
                <Label htmlFor="month" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Month</Label>
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
                <Label htmlFor="amount" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount ({currencySymbol})</Label>
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
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Strategy</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1 bg-background/50 rounded-lg border border-border/50">
                <button
                  type="button"
                  onClick={() => setType('reduceTerm')}
                  className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all ${type === 'reduceTerm'
                    ? 'bg-secondary text-secondary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary/10 hover:text-secondary'
                    }`}
                >
                  Reduce Term
                </button>
                <button
                  type="button"
                  onClick={() => setType('reducePayment')}
                  className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all ${type === 'reducePayment'
                    ? 'bg-secondary text-secondary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary/10 hover:text-secondary'
                    }`}
                >
                  Reduce Payment
                </button>
              </div>
            </div>
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
                  Update Payment
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Payment
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
          <h3 className="text-sm font-medium text-muted-foreground">Scheduled Payments</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {extraPayments.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border/50 rounded-lg"
                >
                  No extra payments scheduled
                </motion.div>
              ) : (
                extraPayments.map((payment) => {
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
                              <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded no-underline">Disabled</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {plan ? getPlanDisplayName(plan, currency) : 'Unknown Plan'} • {payment.type === 'reduceTerm' ? 'Term' : 'Payment'}
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
                          title={payment.enabled === false ? "Click to enable" : "Click to disable"}
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
