import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMortgage } from '@/context/MortgageProvider';

export const DataImport: React.FC = () => {
    const { importData } = useMortgage();
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
                    amount: p.amount || p.initialAmount, // Backward compatibility
                    interestRate: p.interestRate || p.annualRate, // Backward compatibility
                    takenDate: p.takenDate || p.startDate, // Backward compatibility attempt (might be wrong format if old data)
                    firstPaymentDate: p.firstPaymentDate || p.startDate, // Backward compatibility
                    lastPaymentDate: p.lastPaymentDate || '', // No clear mapping, might need manual fix
                }));

                const extraPayments = (data.extraPayments || []).map((ep: any) => ({
                    ...ep,
                    month: ep.month || ep.date, // Handle both formats
                }));

                const rateChanges = (data.rateChanges || []).map((rc: any) => ({
                    ...rc,
                    month: rc.month || rc.date, // Handle both formats
                }));

                const currency = data.currency || 'USD';

                importData({
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
