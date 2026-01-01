import React, { useRef } from 'react';
import { toast } from 'react-toastify';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlans } from '@/context/PlanProvider';
import { usePortfolios } from '@/context/PortfoliosContext';
import { ExportPortfolio, ExtraPayment, GracePeriod, Plan, RateChange } from '@/types';
import { useTranslation } from 'react-i18next';


import { useParams } from 'react-router';

export const PortfolioImport: React.FC = () => {
    const { t } = useTranslation(['portfolio-page', 'common']);
    const { importData } = usePlans();
    const { updatePortfolio } = usePortfolios();
    const { portfolioId } = useParams<{ portfolioId: string }>();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data: ExportPortfolio = JSON.parse(content);

                // Basic validation
                if (!data.plans || !Array.isArray(data.plans))
                    throw new Error('Invalid format: Missing "plans" array');

                // Transform data to match internal state structure if needed
                const plans = data.plans.map((p: any) => p as Plan);
                const extraPayments = (data.extraPayments || []).map((ep: any) => ep as ExtraPayment);
                const rateChanges = (data.rateChanges || []).map((rc: any) => rc as RateChange);
                const gracePeriods = (data.gracePeriods || []).map((gp: any) => gp as GracePeriod);

                const currency = data.currency || 'ILS';

                importData({
                    plans,
                    extraPayments,
                    rateChanges,
                    gracePeriods,
                    currency,
                });

                if (data.portfolio && portfolioId)
                    updatePortfolio(portfolioId, data.portfolio);

                toast.success(t('import.success', { ns: 'common' }));
            } catch (error) {
                console.error('Import error:', error);
                toast.error(t('import.error', { ns: 'common' }));
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
                title={t('import.buttonTitle', { ns: 'common' })}
                className="gap-2"
            >
                <Upload className="h-4 w-4" />
                {t('importButton')}
            </Button>
        </>
    );
};
