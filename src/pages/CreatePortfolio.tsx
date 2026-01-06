import { motion } from 'framer-motion';
import { FolderPlus } from 'lucide-react';
import { useNavigate } from 'react-router';
import { usePortfolios } from '@/context/PortfoliosContext';
import { PortfolioForm } from '@/components/forms/PortfolioForm';
import { PortfolioType } from '@/types';
import { useTranslation } from 'react-i18next';
import { useImportPortfolio } from '@/hooks/useImportPortfolio';

export function CreatePortfolio() {
    const { t } = useTranslation(['dashboard', 'common']);
    const { addPortfolio } = usePortfolios();
    const navigate = useNavigate();
    const { importPortfolio } = useImportPortfolio();

    const handleCreatePortfolio = (name: string, type: PortfolioType, color: string, icon: string) => {
        const id = addPortfolio(name, color, icon, type);
        navigate(`/${type}/${id}`);
    };

    const handleImportSuccess = (data: any) => {
        importPortfolio(data);
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-8">
            <main className="px-4 py-8 max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <FolderPlus className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">{t('sidebar.newPortfolio', { ns: 'common' })}</h2>
                            <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
                        </div>
                    </div>

                    <PortfolioForm
                        onCreate={handleCreatePortfolio}
                        onImport={handleImportSuccess}
                        onCancel={() => navigate(-1)}
                    />
                </motion.div>
            </main>

        </div>
    );
}
