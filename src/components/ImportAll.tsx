import React, { useRef } from 'react';
import { toast } from 'react-toastify';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

import { usePortfolios } from '@/context/PortfoliosContext';
import { ExportPortfolio } from '@/types';

interface ImportAllProps {
  showText?: boolean;
  className?: string;
}

export const ImportAll: React.FC<ImportAllProps> = ({ showText = true, className }) => {
  const { t } = useTranslation('common'); // settings namespace
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

        const ids = addMultiplePortfolios(data.map((p) => p.portfolio));

        data.forEach((portfolio, idx) => {
          const id = ids[idx];

          localStorage.setItem(`${id}-plans`, JSON.stringify(portfolio.plans));
          localStorage.setItem(`${id}-extra-payments`, JSON.stringify(portfolio.extraPayments));
          localStorage.setItem(`${id}-rate-changes`, JSON.stringify(portfolio.rateChanges));
          localStorage.setItem(`${id}-grace-periods`, JSON.stringify(portfolio.gracePeriods));
          localStorage.setItem(`${id}-currency`, JSON.stringify(portfolio.currency));
        });

        toast.success(t('import.success'));
      } catch (error) {
        console.error('Import error:', error);
        toast.error(t('import.error'));
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
        title={t('import.buttonTitle')}
        className={className}
      >
        <Upload className="h-4 w-4" />
        {showText && <span>{t('import.all')}</span>}
      </Button>
    </>
  );
};
