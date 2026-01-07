import { Modal } from '@/components/ui/modal';
import { PortfolioType } from '@/types';
import { useTranslation } from 'react-i18next';
import { PortfolioForm } from '../forms/PortfolioForm';
import { useImportPortfolio } from '@/hooks/useImportPortfolio';
import { usePortfolios } from '@/context/PortfoliosContext';
import { useNavigate } from 'react-router';

interface PortfolioCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PortfolioCreationModal({ isOpen, onClose }: PortfolioCreationModalProps) {
    const { t } = useTranslation(['dashboard', 'common']);

    const { addPortfolio } = usePortfolios();
    const { importPortfolio } = useImportPortfolio();
    const navigate = useNavigate();

    const handleImport = (data: any) => {
        importPortfolio(data);
        onClose();
    };

    const handleCreatePortfolio = (name: string, type: PortfolioType, color: string, icon: string) => {
        const newId = addPortfolio(name, color, icon, type);
        navigate(`/${type}/${newId}`);
        onClose();
    };

    return (
        <Modal
            title={t('create-modal.title')}
            isOpen={isOpen}
            onClose={onClose}
            className="sm:max-w-4xl" // Make it wider to accommodate the grid
        >
            <PortfolioForm
                onCreate={handleCreatePortfolio}
                onImport={handleImport}
                onCancel={onClose}
            />
        </Modal>
    );
}


