import { useState } from 'react';
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
  onDeletePlan: (id: string) => void;
}

export function MortgageForm({ plans, currency, onAddPlan, onDeletePlan }: MortgageFormProps) {
  const [name, setName] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [annualRate, setAnnualRate] = useState('');
  const [termMonths, setTermMonths] = useState('');
  const [startDate, setStartDate] = useState('');
  
  const currencySymbol = getCurrencySymbol(currency);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!initialAmount || !annualRate || !termMonths || !startDate) {
      alert('Please fill in all fields');
      return;
    }

    // Validate date format (MM/YYYY)
    const dateRegex = /^(0[1-9]|1[0-2])\/\d{4}$/;
    if (!dateRegex.test(startDate)) {
      alert('Start date must be in MM/YYYY format (e.g., 01/2024)');
      return;
    }

    onAddPlan({
      name: name.trim() || undefined,
      initialAmount: parseFloat(initialAmount),
      annualRate: parseFloat(annualRate),
      termMonths: parseInt(termMonths),
      startDate,
    });

    // Reset form
    setName('');
    setInitialAmount('');
    setAnnualRate('');
    setTermMonths('');
    setStartDate('');
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Mortgage Plans</CardTitle>
      </CardHeader>
      <CardContent className="grow grid auto-rows-fr">
        <form onSubmit={handleSubmit} className="space-y-4 grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="planName">Plan Name (Optional)</Label>
              <Input
                id="planName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Primary Home, Investment Property"
              />
              <p className="text-xs text-muted-foreground">
                If left empty, will use: {currencySymbol}Amount (Start Date)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="initialAmount">Initial Amount ({currencySymbol})</Label>
              <Input
                id="initialAmount"
                type="number"
                step="0.01"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                placeholder="300000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="annualRate">Annual Rate (%)</Label>
              <Input
                id="annualRate"
                type="number"
                step="0.01"
                value={annualRate}
                onChange={(e) => setAnnualRate(e.target.value)}
                placeholder="5.5"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="termMonths">Term (Months)</Label>
              <Input
                id="termMonths"
                type="number"
                value={termMonths}
                onChange={(e) => setTermMonths(e.target.value)}
                placeholder="360"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date (MM/YYYY)</Label>
              <Input
                id="startDate"
                type="text"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="01/2024"
                pattern="(0[1-9]|1[0-2])\/\d{4}"
                required
              />
            </div>
          </div>
          <Button type="submit">Add Mortgage Plan</Button>
        </form>

        {plans.length > 0 && (
          <div className="mt-6 space-y-2">
            <h3 className="text-lg font-semibold">Current Plans</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div>
                    <div className="font-medium">
                      {getPlanDisplayName(plan, currency)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {plan.annualRate}% for {plan.termMonths} months (starts {plan.startDate})
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => onDeletePlan(plan.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
