import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MortgagePlan, ExtraPayment, RateChange } from '@/types';
import { CurrencyCode } from '@/lib/currency';

interface DataImportProps {
    onImport: (data: {
        plans: MortgagePlan[];
        extraPayments: ExtraPayment[];
        rateChanges: RateChange[];
        currency: CurrencyCode;
    }) => void;
}

export const DataImport: React.FC<DataImportProps> = ({ onImport }) => {
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
                const plans = data.mortgagePlans;

                const extraPayments = (data.extraPayments || []).map((ep: any) => ({
                    ...ep,
                    month: ep.month || ep.date, // Handle both formats
                }));

                const rateChanges = (data.rateChanges || []).map((rc: any) => ({
                    ...rc,
                    month: rc.month || rc.date, // Handle both formats
                }));

                const currency = data.currency || 'USD';

                onImport({
                    plans,
                    extraPayments,
                    rateChanges,
                    currency,
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
                className="bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-primary/10 gap-2"
            >
                <Upload className="h-4 w-4" />
                Import
            </Button>
        </>
    );
};
