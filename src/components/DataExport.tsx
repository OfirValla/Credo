import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { MortgagePlan, ExtraPayment, RateChange } from '@/types';
import { CurrencyCode } from '@/lib/currency';

export const DataExport: React.FC = () => {
  const [plans] = useLocalStorage<MortgagePlan[]>('mortgage-plans', []);
  const [extraPayments] = useLocalStorage<ExtraPayment[]>('mortgage-extra-payments', []);
  const [rateChanges] = useLocalStorage<RateChange[]>('mortgage-rate-changes', []);
  const [currency] = useLocalStorage<CurrencyCode>('mortgage-currency', 'USD');

  const exportData = () => {
    // Format dates to ISO string for consistency
    const formattedPlans = plans.map((plan: MortgagePlan) => ({
      ...plan,
      takenDate: plan.takenDate,
      firstPaymentDate: plan.firstPaymentDate,
      lastPaymentDate: plan.lastPaymentDate,
    }));

    const formattedExtraPayments = extraPayments.map((payment: ExtraPayment) => ({
      ...payment,
      date: payment.month,
    }));

    const formattedRateChanges = rateChanges.map((change: RateChange) => ({
      ...change,
      date: change.month,
    }));

    const data = {
      mortgagePlans: formattedPlans,
      extraPayments: formattedExtraPayments,
      rateChanges: formattedRateChanges,
      currency: currency,
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'mortgage_data.json';
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };

  return (
    <Button
      variant="outline"
      onClick={exportData}
      className="bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-primary/10 gap-2"
    >
      <Download className="h-4 w-4" />
      Export
    </Button>
  );
};