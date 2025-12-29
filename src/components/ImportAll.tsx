import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { usePortfolios } from '@/context/PortfoliosContext';
import { ExportPortfolio } from '@/types';

export const ImportAll: React.FC = () => {
  const { addMultiplePortfolios } = usePortfolios();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data: ExportPortfolio[] = JSON.parse(content);

        const ids = addMultiplePortfolios(data.map(p => p.portfolio));

        data.forEach((portfolio, idx) => {
          const { portfolio: p } = portfolio;
          const id = ids[idx];

          localStorage.setItem(`${p.type}-plans-${id}`, JSON.stringify(portfolio.plans));
          localStorage.setItem(`${p.type}-extra-payments-${id}`, JSON.stringify(portfolio.extraPayments));
          localStorage.setItem(`${p.type}-rate-changes-${id}`, JSON.stringify(portfolio.rateChanges));
          localStorage.setItem(`${p.type}-grace-periods-${id}`, JSON.stringify(portfolio.gracePeriods));
          localStorage.setItem(`${p.type}-currency-${id}`, JSON.stringify(portfolio.currency));
        });

        alert('Data imported successfully!');
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import data. Please check the file format.');
      } finally {
        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />
      <Button
        variant="outline"
        onClick={handleButtonClick}
        title="Import Data"
        className="bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-primary/10 gap-2 w-full"
      >
        <Upload className="h-4 w-4" />
        Import all portfolios
      </Button>
    </>
  );
};
