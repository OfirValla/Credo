import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SlidingSelect } from '@/components/ui/sliding-select';

import { Modal } from '@/components/ui/modal';

import { PORTFOLIO_COLORS, PORTFOLIO_ICONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { PortfolioType } from '@/types';

interface PortfolioCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, type: PortfolioType, color: string, icon: string) => void;
}

export function PortfolioCreationModal({ isOpen, onClose, onCreate }: PortfolioCreationModalProps) {
    const [name, setName] = useState('');
    const [type, setType] = useState<PortfolioType>(PortfolioType.MORTGAGE);
    const [color, setColor] = useState(PORTFOLIO_COLORS[0]);
    const [icon, setIcon] = useState(PORTFOLIO_ICONS[0].name);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onCreate(name.trim(), type, color, icon);
            resetForm();
        }
    };

    const resetForm = () => {
        setName('');
        setType(PortfolioType.MORTGAGE);
        setColor(PORTFOLIO_COLORS[0]);
        setIcon(PORTFOLIO_ICONS[0].name);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Modal title="Create New Portfolio" isOpen={isOpen} onClose={handleClose}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Portfolio Name</label>
                    <Input
                        placeholder="My awesome portfolio..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <SlidingSelect
                        value={type}
                        onValueChange={(v) => setType(v as PortfolioType)}
                        options={[
                            { value: PortfolioType.MORTGAGE, label: 'Mortgage' },
                            { value: PortfolioType.LOAN, label: 'Loan' }
                        ]}
                        color="bg-primary"
                        textColor="text-primary-foreground"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Color</label>
                    <div className="grid grid-cols-9 gap-2">
                        {PORTFOLIO_COLORS.map((c) => (
                            <div
                                key={c}
                                className={cn(
                                    "w-8 h-8 rounded-full cursor-pointer hover:scale-110 transition-transform",
                                    c,
                                    color === c && "ring-2 ring-offset-2 ring-primary"
                                )}
                                onClick={() => setColor(c)}
                            />
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Icon</label>
                    <div className="grid grid-cols-8 gap-2">
                        {PORTFOLIO_ICONS.map(({ name: iconName, icon: Icon }) => (
                            <div
                                key={iconName}
                                className={cn(
                                    "w-9 h-9 rounded-md flex items-center justify-center cursor-pointer hover:bg-muted transition-colors border border-transparent",
                                    icon === iconName && "bg-primary/10 border-primary text-primary"
                                )}
                                onClick={() => setIcon(iconName)}
                            >
                                <Icon className="w-4 h-4" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={!name.trim()}>
                        Create Portfolio
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
