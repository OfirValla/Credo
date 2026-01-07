import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SlidingSelect } from '@/components/ui/sliding-select';
import { PORTFOLIO_COLORS, PORTFOLIO_ICONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { ExportPortfolio, Portfolio, PortfolioType } from '@/types';
import { useTranslation } from 'react-i18next';

import { useRef } from 'react';
import { Upload } from 'lucide-react';
import { toast } from 'react-toastify';

interface PortfolioFormProps {
    onCreate: (name: string, type: PortfolioType, color: string, icon: string) => void;
    onImport?: (data: any) => void;
    onCancel?: () => void;
}

export function PortfolioForm({ onCreate, onImport, onCancel }: PortfolioFormProps) {
    const { t } = useTranslation(['dashboard', 'common']);
    const [name, setName] = useState('');
    const [type, setType] = useState<PortfolioType>(PortfolioType.MORTGAGE);
    const [color, setColor] = useState(PORTFOLIO_COLORS[0]);
    const [icon, setIcon] = useState(PORTFOLIO_ICONS[0].name);
    const [isDragging, setIsDragging] = useState(false);
    const [pendingData, setPendingData] = useState<{ name: string, data: ExportPortfolio } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onCreate(name.trim(), type, color, icon);
        }
    };

    const handleFile = (file: File) => {
        if (!file) return;
        if (!file.name.endsWith('.json')) {
            toast.error(t('import.error', { ns: 'common' }));
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);
                setPendingData({ name: file.name, data });
            } catch (error) {
                toast.error(t('import.error', { ns: 'common' }));
            } finally {
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    const handleConfirmImport = () => {
        if (pendingData && onImport) {
            onImport(pendingData.data);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleFile(file);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                    <div className="flex flex-wrap gap-2">
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
                    <div className="flex flex-wrap gap-2">
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

            <div className="flex md:hidden items-center gap-4 my-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest py-2">
                    {t('portfolio-form.or', { ns: 'common' })}
                </span>
                <div className="h-px flex-1 bg-border" />
            </div>

            {/* Dropzone section */}
            <div className="relative flex flex-col items-center justify-center">
                <div className="hidden md:flex absolute -left-4 top-0 bottom-0 items-center">
                    <div className="h-3/4 w-px bg-border relative">
                        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs font-bold text-muted-foreground uppercase tracking-widest py-5">
                            {t('portfolio-form.or', { ns: 'common' })}
                        </span>
                    </div>
                </div>

                <div
                    className={cn(
                        "w-full h-full min-h-[350px] rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-6 p-10 text-center group relative overflow-hidden text-foreground",
                        isDragging
                            ? "border-primary bg-primary/5 scale-[0.99] shadow-inner"
                            : "border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/30",
                        !pendingData && "cursor-pointer"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !pendingData && fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".json"
                        onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                    />

                    {/* Background decoration */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-muted/5 pointer-events-none" />

                    <div className={cn(
                        "p-5 rounded-full bg-background border border-border shadow-sm transition-all duration-300 z-10",
                        !pendingData && "group-hover:scale-110 group-hover:-translate-y-1 group-hover:shadow-md",
                        (isDragging || !!pendingData) && "scale-110 bg-primary/10 border-primary text-primary"
                    )}>
                        <Upload className={cn(
                            "w-10 h-10 transition-colors",
                            (isDragging || !!pendingData) ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                        )} />
                    </div>

                    <div className="space-y-2 z-10">
                        <h3 className="font-semibold text-xl tracking-tight">
                            {pendingData ? pendingData.data.portfolio.name : t('portfolio-form.import-title', { ns: 'common' })}
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-[200px] mx-auto leading-relaxed">
                            {pendingData
                                ? (
                                    <>
                                        <div>{pendingData.data.portfolio.name}</div>
                                        <span>({(JSON.stringify(pendingData.data).length / 1024).toFixed(2)} KB)</span>
                                    </>
                                )
                                : t('portfolio-form.import-subtitle', { ns: 'common' })
                            }
                        </p>
                    </div>

                    <div className="z-10 mt-2 flex gap-3">
                        {pendingData ? (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPendingData(null);
                                    }}
                                    className="rounded-full px-6 bg-background"
                                >
                                    {t('cancel', { ns: 'common' })}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleConfirmImport();
                                    }}
                                    className="rounded-full px-8 font-medium bg-primary text-primary-foreground shadow-md transition-all hover:scale-105 active:scale-95"
                                >
                                    {t('import.buttonTitle', { ns: 'common' })}
                                </Button>
                            </>
                        ) : (
                            <Button
                                type="button"
                                variant="secondary"
                                className="rounded-full px-8 font-medium bg-background hover:bg-primary hover:text-primary-foreground transition-all shadow-sm border border-border"
                            >
                                {t('portfolio-form.import-button', { ns: 'common' })}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

