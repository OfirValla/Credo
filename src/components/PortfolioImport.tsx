import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlans } from '@/context/PlanProvider';
import { usePortfolios } from '@/context/PortfoliosContext';
import { ExportPortfolio, ExtraPayment, GracePeriod, Plan, RateChange } from '@/types';

export const PortfolioImport: React.FC = () => {
    const { importData } = usePlans();
    const { updatePortfolio, currentPortfolioId } = usePortfolios();
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

                if (data.portfolio)
                    updatePortfolio(currentPortfolioId, data.portfolio);

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
                className="bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-primary/10 gap-2"
            >
                <Upload className="h-4 w-4" />
                Import
            </Button>
        </>
    );
};
