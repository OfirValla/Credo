import React, { useRef } from 'react';
import { toast } from 'react-toastify';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

import { usePortfolios } from '@/context/PortfoliosContext';
import { ExportPortfolio } from '@/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export const ImportAll: React.FC = () => {
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
        variant="ghost"
        className={cn(
          "group flex justify-start items-center p-2 rounded-lg cursor-pointer transition-colors relative hover:bg-muted hover:text-foreground w-full"
        )}
        onClick={handleButtonClick}
      >
        <div className="min-w-[2rem] flex justify-center items-center">
          <Upload className="w-5 h-5" />
        </div>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="ml-3 font-medium text-sm whitespace-nowrap overflow-hidden"
        >
          {t('import.all')}
        </motion.span>
      </Button>
    </>
  );
};
