import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SlidingSelect } from '@/components/ui/sliding-select';
import { PORTFOLIO_COLORS, PORTFOLIO_ICONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { PortfolioType } from '@/types';
import { useTranslation } from 'react-i18next';

interface PortfolioFormProps {
    onCreate: (name: string, type: PortfolioType, color: string, icon: string) => void;
    onCancel?: () => void;
}

export function PortfolioForm({ onCreate, onCancel }: PortfolioFormProps) {
    const { t } = useTranslation(['dashboard', 'common']);
    const [name, setName] = useState('');
    const [type, setType] = useState<PortfolioType>(PortfolioType.MORTGAGE);
    const [color, setColor] = useState(PORTFOLIO_COLORS[0]);
    const [icon, setIcon] = useState(PORTFOLIO_ICONS[0].name);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onCreate(name.trim(), type, color, icon);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-medium">{t('create-modal.nameLabel')}</label>
                <Input
                    placeholder={t('create-modal.namePlaceholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">{t('create-modal.typeLabel')}</label>
                <SlidingSelect
                    value={type}
                    onValueChange={(v) => setType(v as PortfolioType)}
                    options={[
                        { value: PortfolioType.MORTGAGE, label: t('mortgage', { ns: 'common' }) },
                        { value: PortfolioType.LOAN, label: t('loan', { ns: 'common' }) }
                    ]}
                    color="bg-primary"
                    textColor="text-primary-foreground"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">{t('sidebar.color', { ns: 'common' })}</label>
                <div className="grid grid-cols-5 xs:grid-cols-7 sm:grid-cols-9 gap-2">
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
                <label className="text-sm font-medium">{t('sidebar.icon', { ns: 'common' })}</label>
                <div className="grid grid-cols-4 xs:grid-cols-6 sm:grid-cols-8 gap-2">
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
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        {t('cancel', { ns: 'common' })}
                    </Button>
                )}
                <Button type="submit" disabled={!name.trim()}>
                    {t('createPortfolio')}
                </Button>
            </div>
        </form>
    );
}
