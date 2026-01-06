import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    itemName?: string;
}

export function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText,
    cancelText,
    itemName
}: DeleteConfirmationModalProps) {
    const { t } = useTranslation('common');

    return (
        <Modal
            title={title || t('delete-modal.title')}
            isOpen={isOpen}
            onClose={onClose}
        >
            <div className="space-y-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-destructive/10 rounded-full shrink-0">
                        <AlertTriangle className="w-6 h-6 text-destructive" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                            {description || t('delete-modal.description', { name: itemName || '' })}
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                    >
                        {cancelText || t('delete-modal.cancel')}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {confirmText || t('delete-modal.confirm')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
