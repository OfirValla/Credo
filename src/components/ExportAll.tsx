import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { usePortfolios } from '@/context/PortfoliosContext';
import { ExportPortfolio } from '@/types';
import { CurrencyCode } from '@/lib/currency';

export const ExportAll: React.FC = () => {
  const { portfolios } = usePortfolios();

  const exportData = () => {
    const data: ExportPortfolio[] = [];
    portfolios.forEach(portfolio => {
      const currencyItem = localStorage.getItem(`${portfolio.id}-currency`);
      const currency: CurrencyCode = currencyItem ? JSON.parse(currencyItem) : 'ILS';

      const plans = JSON.parse(localStorage.getItem(`${portfolio.id}-plans`) ?? '[]');
      const extraPayments = JSON.parse(localStorage.getItem(`${portfolio.id}-extra-payments`) ?? '[]');
      const rateChanges = JSON.parse(localStorage.getItem(`${portfolio.id}-rate-changes`) ?? '[]');
      const gracePeriods = JSON.parse(localStorage.getItem(`${portfolio.id}-grace-periods`) ?? '[]');

      data.push({
        portfolio: portfolio,
        currency: currency,
        plans: plans,
        extraPayments: extraPayments,
        rateChanges: rateChanges,
        gracePeriods: gracePeriods
      });
    });

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const day = String(new Date().getDate()).padStart(2, '0');          // 01–31
    const month = String(new Date().getMonth() + 1).padStart(2, '0');   // 01–12
    const year = new Date().getFullYear();                              // e.g. 2025

    const a = document.createElement('a');
    a.href = url;
    a.download = `all_data_${year}-${month}-${day}.json`;
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
      className="gap-2 w-full"
    >
      <Download className="h-4 w-4" />
      Export all portfolios
    </Button>
  );
};
