import { Modal } from '@/components/ui/modal';
import { PortfolioType } from '@/types';
import { useTranslation } from 'react-i18next';
import { PortfolioForm } from '../forms/PortfolioForm';


interface PortfolioCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, type: PortfolioType, color: string, icon: string) => void;
}

export function PortfolioCreationModal({ isOpen, onClose, onCreate }: PortfolioCreationModalProps) {
    const { t } = useTranslation(['dashboard', 'common']);

    return (
        <Modal title={t('create-modal.title')} isOpen={isOpen} onClose={onClose}>
            <PortfolioForm onCreate={onCreate} onCancel={onClose} />
        </Modal>
    );
}

