import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { Plan, ExtraPayment, RateChange } from '@/types';
import { usePlans } from '@/context/PlanProvider';
import { usePortfolios } from '@/context/PortfolioContext';

export const DataExport: React.FC = () => {
  const { plans, extraPayments, rateChanges, gracePeriods, currency } = usePlans();
  const { portfolios, currentPortfolioId } = usePortfolios();

  const exportData = () => {
    // Format dates to ISO string for consistency
    const formattedPlans = plans.map((plan: Plan) => ({
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

    const formattedGracePeriods = gracePeriods.map((gp) => ({
      ...gp,
    }));

    const currentPortfolio = portfolios.find(p => p.id === currentPortfolioId);

    const data = {
      Plans: formattedPlans,
      extraPayments: formattedExtraPayments,
      rateChanges: formattedRateChanges,
      gracePeriods: formattedGracePeriods,
      currency: currency,
      portfolio: {
        name: currentPortfolio?.name,
        type: currentPortfolio?.type,
        color: currentPortfolio?.color,
        icon: currentPortfolio?.icon,
      }
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const day = String(new Date().getDate()).padStart(2, '0');          // 01–31
    const month = String(new Date().getMonth() + 1).padStart(2, '0');   // 01–12
    const year = new Date().getFullYear();                              // e.g. 2025

    const a = document.createElement('a');
    a.href = url;
    a.download = `mortgage_data_${year}-${month}-${day}.json`;
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
