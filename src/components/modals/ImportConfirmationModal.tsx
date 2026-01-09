import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { ExportPortfolio } from '@/types';
import { FileDown, Package } from 'lucide-react';

interface ImportConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    data: ExportPortfolio[];
}

export const ImportConfirmationModal: React.FC<ImportConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    data,
}) => {
    const { t } = useTranslation('common');

    return (
        <Modal
            title={t('import.confirmation.title')}
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-lg"
        >
            <div className="space-y-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-full shrink-0">
                        <FileDown className="w-6 h-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                            {t('import.confirmation.description')}
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-foreground">
                        {t('import.confirmation.preview-title')}
                    </h3>
                    <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {data.map((item, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-background rounded-md border border-border">
                                        <Package className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <span className="text-sm font-medium">{item.portfolio.name}</span>
                                </div>
                                <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded-full border border-border">
                                    {t('import.confirmation.plan-count', { count: item.plans.length })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={onClose}>
                        {t('import.confirmation.cancel')}
                    </Button>
                    <Button onClick={onConfirm}>
                        {t('import.confirmation.confirm')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
