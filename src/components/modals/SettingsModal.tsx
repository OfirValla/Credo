import { Modal } from '@/components/ui/modal';
import { ThemeSelect } from '../ThemeSelect';
import { LanguageSelect } from '../LanguageSelect';
import { ClearCache } from '../ClearCache';
import { ExportAll } from '../ExportAll';
import { ImportAll } from '../ImportAll';

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
                <div className="space-y-2">
                    <label className="text-sm font-medium">Language</label>
                    <LanguageSelect className="w-full" />
                </div>

                <div className="space-y-2 border-t border-border pt-6">
                    <ExportAll />
                    <ImportAll />
                </div>

                <div className="space-y-2 border-t border-border pt-6">
                    <ClearCache />
                </div>
            </div>
        </Modal>
    );
}
