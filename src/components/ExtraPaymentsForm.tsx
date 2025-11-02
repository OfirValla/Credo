import { useState } from 'react';
import { ExtraPayment, MortgagePlan } from '@/types';
import { CurrencyCode, getCurrencySymbol, formatCurrency } from '@/lib/currency';
import { getPlanDisplayName } from '@/lib/planUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

interface ExtraPaymentsFormProps {
  plans: MortgagePlan[];
  currency: CurrencyCode;
  extraPayments: ExtraPayment[];
  onAddExtraPayment: (payment: Omit<ExtraPayment, 'id'>) => void;
  onDeleteExtraPayment: (id: string) => void;
}

export function ExtraPaymentsForm({
  plans,
  currency,
  extraPayments,
  onAddExtraPayment,
  onDeleteExtraPayment,
}: ExtraPaymentsFormProps) {
  const [month, setMonth] = useState('');
  const [planId, setPlanId] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'reduceTerm' | 'reducePayment'>('reduceTerm');
  
  const currencySymbol = getCurrencySymbol(currency);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!month || !planId || !amount) {
      alert('Please fill in all fields');
      return;
    }

    // Validate date format (MM/YYYY)
    const dateRegex = /^(0[1-9]|1[0-2])\/\d{4}$/;
    if (!dateRegex.test(month)) {
      alert('Month must be in MM/YYYY format (e.g., 01/2024)');
      return;
    }

    onAddExtraPayment({
      month,
      planId,
      amount: parseFloat(amount),
      type,
    });

    // Reset form
    setMonth('');
    setPlanId('');
    setAmount('');
    setType('reduceTerm');
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Extra Payments</CardTitle>
      </CardHeader>
      <CardContent className="grow grid auto-rows-fr">
        <form onSubmit={handleSubmit} className="space-y-4 grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plan">Mortgage Plan</Label>
              <Select
                id="plan"
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                required
              >
                <option value="">Select a plan</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {getPlanDisplayName(plan, currency)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="month">Month (MM/YYYY)</Label>
              <Input
                id="month"
                type="text"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="06/2024"
                pattern="(0[1-9]|1[0-2])\/\d{4}"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ({currencySymbol})</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Payment Type</Label>
              <Select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as 'reduceTerm' | 'reducePayment')}
                required
              >
                <option value="reduceTerm">Reduce Term</option>
                <option value="reducePayment">Reduce Payment</option>
              </Select>
            </div>
          </div>
          <Button type="submit" disabled={plans.length === 0}>
            Add Extra Payment
          </Button>
        </form>

        {extraPayments.length > 0 && (
          <div className="mt-6 space-y-2">
            <h3 className="text-lg font-semibold">Scheduled Extra Payments</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {extraPayments.map((payment) => {
                const plan = plans.find((p) => p.id === payment.planId);
                return (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div>
                      <div className="font-medium">
                        {getPlanDisplayName(plan, currency)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                      {formatCurrency(payment.amount, currency)} extra payment scheduled for {payment.month} ({payment.type === 'reduceTerm' ? 'Reduce Term' : 'Reduce Payment'})
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => onDeleteExtraPayment(payment.id)}
                    >
                      Delete
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
