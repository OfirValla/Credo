import { Modal } from '@/components/ui/modal';
import { PortfolioType } from '@/types';
import { useTranslation } from 'react-i18next';
import { PortfolioForm } from '../forms/PortfolioForm';


interface PortfolioCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, type: PortfolioType, color: string, icon: string) => void;
    onImport?: (data: any) => void;
}

export function PortfolioCreationModal({ isOpen, onClose, onCreate, onImport }: PortfolioCreationModalProps) {
    const { t } = useTranslation(['dashboard', 'common']);

    return (
        <Modal
            title={t('create-modal.title')}
            isOpen={isOpen}
            onClose={onClose}
            className="sm:max-w-4xl" // Make it wider to accommodate the grid
        >
            <PortfolioForm
                onCreate={onCreate}
                onImport={onImport}
                onCancel={onClose}
            />
        </Modal>
    );
}


