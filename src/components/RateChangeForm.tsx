import { useState } from 'react';
import { RateChange, MortgagePlan } from '@/types';
import { CurrencyCode, getCurrencySymbol, formatCurrency } from '@/lib/currency';
import { getPlanDisplayName } from '@/lib/planUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

interface RateChangeFormProps {
  plans: MortgagePlan[];
  currency: CurrencyCode;
  rateChanges: RateChange[];
  onAddRateChange: (rateChange: Omit<RateChange, 'id'>) => void;
  onDeleteRateChange: (id: string) => void;
}

export function RateChangeForm({
  plans,
  currency,
  rateChanges,
  onAddRateChange,
  onDeleteRateChange,
}: RateChangeFormProps) {
  const [month, setMonth] = useState('');
  const [planId, setPlanId] = useState('');
  const [newAnnualRate, setNewAnnualRate] = useState('');
  
  const currencySymbol = getCurrencySymbol(currency);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!month || !planId || !newAnnualRate) {
      alert('Please fill in all fields');
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

    onAddRateChange({
      month,
      planId,
      newAnnualRate: rate,
    });

    // Reset form
    setMonth('');
    setPlanId('');
    setNewAnnualRate('');
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Interest Rate Changes</CardTitle>
      </CardHeader>
      <CardContent className="grow grid auto-rows-fr">
        <form onSubmit={handleSubmit} className="space-y-4 grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rate-plan">Mortgage Plan</Label>
              <Select
                id="rate-plan"
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
              <Label htmlFor="rate-month">Effective Month (MM/YYYY)</Label>
              <Input
                id="rate-month"
                type="text"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="06/2024"
                pattern="(0[1-9]|1[0-2])\/\d{4}"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-rate">New Annual Rate (%)</Label>
              <Input
                id="new-rate"
                type="number"
                step="0.01"
                value={newAnnualRate}
                onChange={(e) => setNewAnnualRate(e.target.value)}
                placeholder="5.5"
                min="0"
                max="100"
                required
              />
            </div>
          </div>
          <Button type="submit" disabled={plans.length === 0}>
            Add Rate Change
          </Button>
        </form>

        {rateChanges.length > 0 && (
          <div className="mt-6 space-y-2">
            <h3 className="text-lg font-semibold">Scheduled Rate Changes</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {rateChanges.map((rateChange) => {
                const plan = plans.find((p) => p.id === rateChange.planId);
                return (
                  <div
                    key={rateChange.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div>
                      <div className="font-medium">
                        {getPlanDisplayName(plan, currency)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Annual Interest {rateChange.newAnnualRate}%, effective from {rateChange.month}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => onDeleteRateChange(rateChange.id)}
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
