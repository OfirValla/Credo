import { SlidingSelect } from '@/components/ui/sliding-select';
import { Modal } from '@/components/ui/modal';
import { Theme, useTheme } from '@/context/ThemeProvider';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { theme, setTheme } = useTheme();

    return (
        <Modal title="Settings" isOpen={isOpen} onClose={onClose}>
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Theme</label>
                    <SlidingSelect
                        value={theme}
                        onValueChange={(v) => setTheme(v as Theme)}
                        options={[
                            { value: Theme.SYSTEM, label: 'System' },
                            { value: Theme.LIGHT, label: 'Light' },
                            { value: Theme.DARK, label: 'Dark' },
                        ]}
                        color="bg-primary"
                        textColor="text-primary-foreground"
                    />
                </div>
            </div>
        </Modal>
    );
}
