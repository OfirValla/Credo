import { Modal } from '@/components/ui/modal';
import { ThemeSelect } from '../ThemeSelect';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {

    return (
        <Modal title="Settings" isOpen={isOpen} onClose={onClose}>
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Theme</label>
                    <ThemeSelect />
                </div>
            </div>
        </Modal>
    );
}
