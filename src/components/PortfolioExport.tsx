import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { usePlans } from '@/context/PlanProvider';
import { usePortfolios } from '@/context/PortfoliosContext';
import { ExportPortfolio } from '@/types';
import { useTranslation } from 'react-i18next';

export const PortfolioExport: React.FC = () => {
  const { t } = useTranslation('portfolio-page');
  const { plans, extraPayments, rateChanges, gracePeriods, currency } = usePlans();
  const { portfolios, currentPortfolioId } = usePortfolios();

  const exportData = () => {
    const currentPortfolio = portfolios.find(p => p.id === currentPortfolioId);
    if (!currentPortfolio) return;
    const data: ExportPortfolio = {
      portfolio: currentPortfolio,
      currency: currency,
      plans: plans,
      extraPayments: extraPayments,
      rateChanges: rateChanges,
      gracePeriods: gracePeriods
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const day = String(new Date().getDate()).padStart(2, '0');          // 01–31
    const month = String(new Date().getMonth() + 1).padStart(2, '0');   // 01–12
    const year = new Date().getFullYear();                              // e.g. 2025

    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentPortfolio.type}_data_${year}-${month}-${day}.json`;
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
      {t('exportButton')}
    </Button>
  );
};
