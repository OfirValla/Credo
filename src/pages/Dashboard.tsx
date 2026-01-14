import { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Plus, HelpCircle } from 'lucide-react';
import { usePortfolios } from '@/context/PortfoliosContext';
import { PortfolioSummaryCard } from '@/components/PortfolioSummaryCard';
import { DashboardStats } from '@/components/DashboardStats';
import { Button } from '@/components/ui/button';
import { PortfolioCreationModal } from '@/components/modals/PortfolioCreationModal';
import { DashboardWelcome } from '@/components/DashboardWelcome';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useTutorial } from '@/hooks/useTutorial';

export function Dashboard() {
    const { t, i18n } = useTranslation('dashboard');
    const { portfolios } = usePortfolios();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const { startTutorial } = useTutorial();

    const handleOpenCreateModal = () => {
        if (isMobile) {
            navigate('/portfolio/create');
        } else {
            setIsModalOpen(true);
        }
    };

    const handleStartTour = () => {
        startTutorial([
            {
                target: 'body',
                content: t('tutorial.welcome.content'),
                title: t('tutorial.welcome.title'),
                placement: 'center',
            },
            {
                target: '#tour-stats',
                content: t('tutorial.stats.content'),
                title: t('tutorial.stats.title'),
            },
            {
                target: '#tour-charts',
                content: t('tutorial.charts.content'),
                title: t('tutorial.charts.title'),
            },
            {
                target: '#tour-portfolios',
                content: t('tutorial.portfolios.content'),
                title: t('tutorial.portfolios.title'),
            },
            {
                target: '#tour-sidebar',
                content: t('tutorial.sidebar.content'),
                title: t('tutorial.sidebar.title'),
                placement: i18n.dir() === 'rtl' ? 'left' : 'right',
            }
        ]);
    };


    return (
        <div className="min-h-screen bg-background text-foreground py-8 px-4">

            <PortfolioCreationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />

            {portfolios.length === 0 ? (
                <div className="pt-8">
                    <DashboardWelcome onCreatePortfolio={handleOpenCreateModal} />
                </div>
            ) : (
                <>
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-10"
                    >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-xl backdrop-blur-sm border border-primary/20">
                                    <LayoutDashboard className="w-8 h-8 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold tracking-tight text-gradient">
                                        {t('title')}
                                    </h1>
                                    <p className="text-muted-foreground mt-1">
                                        {t('subtitle')}
                                    </p>
                                </div>
                            </div>

                            {!isMobile && portfolios.length > 0 && (
                                <Button
                                    variant="outline"
                                    onClick={handleStartTour}
                                    className="gap-2 rounded-full border-primary/20 hover:bg-primary/5"
                                >
                                    <HelpCircle className="w-4 h-4 text-primary" />
                                    <span>{t('tutorial.startTour')}</span>
                                </Button>
                            )}
                        </div>
                    </motion.div>

                    <div id="tour-stats" className="mb-12">
                        <DashboardStats />
                    </div>

                    <div id="tour-portfolios">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="text-xl font-bold text-gradient capitalize">{t('portfolios')}</div>
                            <div className="h-px bg-border flex-1 ml-4"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {portfolios.map((portfolio, index) => (
                                <motion.div
                                    key={portfolio.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 + 0.5 }}
                                >
                                    <PortfolioSummaryCard portfolio={portfolio} />
                                </motion.div>
                            ))}

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: portfolios.length * 0.1 + 0.5 }}
                            >
                                <Button
                                    variant="outline"
                                    className="w-full h-full min-h-[200px] border-dashed flex flex-col gap-4 hover:border-primary hover:bg-primary/5 transition-all"
                                    onClick={handleOpenCreateModal}
                                >

                                    <div className="p-4 rounded-full bg-secondary">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <span className="text-lg font-medium">{t('createPortfolio')}</span>
                                </Button>
                            </motion.div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
