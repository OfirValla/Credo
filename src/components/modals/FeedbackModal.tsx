import { Modal } from '@/components/ui/modal';
import { useTranslation } from 'react-i18next';
import { FeedbackForm } from '../forms/FeedbackForm';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
    const { t } = useTranslation('common');

    return (
        <Modal
            title={t('feedback.title')}
            isOpen={isOpen}
            onClose={onClose}
            className="sm:max-w-xl"
        >
            <FeedbackForm onSuccess={onClose} />
        </Modal>
    );
}
