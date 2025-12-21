import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMortgage } from '@/context/MortgageProvider';
import { usePortfolios } from '@/context/PortfolioContext';

export const DataImport: React.FC = () => {
    const { importData } = useMortgage();
    const { updatePortfolio, currentPortfolioId } = usePortfolios();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);

                // Basic validation
                if (!data.mortgagePlans || !Array.isArray(data.mortgagePlans)) {
                    throw new Error('Invalid format: Missing mortgagePlans');
                }

                // Transform data to match internal state structure if needed
                const plans = data.mortgagePlans.map((p: any) => ({
                    ...p,
                    amount: p.amount,
                    interestRate: p.interestRate,
                    takenDate: p.takenDate,
                    firstPaymentDate: p.firstPaymentDate,
                    lastPaymentDate: p.lastPaymentDate,
                }));

                const extraPayments = (data.extraPayments || []).map((ep: any) => ({
                    ...ep,
                    month: ep.month,
                }));

                const rateChanges = (data.rateChanges || []).map((rc: any) => ({
                    ...rc,
                    month: rc.month,
                }));

                const gracePeriods = (data.gracePeriods || []).map((gp: any) => ({
                    ...gp,
                    month: gp.month, // Ensure month property is preserved if it exists
                }));

                const currency = data.currency || 'USD';

                importData({
                    plans,
                    extraPayments,
                    rateChanges,
                    gracePeriods,
                    currency,
                });

                if (data.portfolio) {
                    updatePortfolio(currentPortfolioId, {
                        type: data.portfolio.type,
                        name: data.portfolio.name,
                        color: data.portfolio.color,
                        icon: data.portfolio.icon
                    });
                }

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
