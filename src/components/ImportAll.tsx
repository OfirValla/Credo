import React, { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

import { usePortfolios } from '@/context/PortfoliosContext';
import { ExportPortfolio } from '@/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ImportConfirmationModal } from './modals/ImportConfirmationModal';

export const ImportAll: React.FC = () => {
  const { t } = useTranslation('common'); // settings namespace
  const { addMultiplePortfolios } = usePortfolios();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingData, setPendingData] = useState<ExportPortfolio[] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data: ExportPortfolio[] = JSON.parse(content);
        setPendingData(data);
        setIsModalOpen(true);
      } catch (error) {
        console.error('Import error:', error);
        toast.error(t('import.error'));
        // Reset input on error so the same file can be picked again
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!pendingData) return;

    try {
      const ids = addMultiplePortfolios(pendingData.map((p) => p.portfolio));

      pendingData.forEach((portfolio, idx) => {
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
      setIsModalOpen(false);
      setPendingData(null);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCancelImport = () => {
    setIsModalOpen(false);
    setPendingData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
        className="group flex justify-start items-center p-2 rounded-lg cursor-pointer transition-colors relative hover:bg-muted hover:text-foreground w-full"
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

      {pendingData && (
        <ImportConfirmationModal
          isOpen={isModalOpen}
          onClose={handleCancelImport}
          onConfirm={handleConfirmImport}
          data={pendingData}
        />
      )}
    </>
  );
};
