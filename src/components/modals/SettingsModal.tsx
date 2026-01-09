import { useTranslation } from 'react-i18next';

import { Modal } from '@/components/ui/modal';
import { SettingsForm } from '../forms/SettingsForm';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { t } = useTranslation('common');

    return (
        <Modal title={t('settings.title')} isOpen={isOpen} onClose={onClose}>
            <SettingsForm />
        </Modal>
    );
}
