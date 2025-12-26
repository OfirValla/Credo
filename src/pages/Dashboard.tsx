import { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Plus } from 'lucide-react';
import { usePortfolios } from '@/context/PortfoliosContext';
import { PortfolioSummaryCard } from '@/components/PortfolioSummaryCard';
import { DashboardStats } from '@/components/DashboardStats';
import { Button } from '@/components/ui/button';
import { PortfolioCreationModal } from '@/components/PortfolioCreationModal';
import { useNavigate } from 'react-router';
import { PortfolioType } from '@/types';
import { ModeToggle } from '@/components/ModeToggle';

export function Dashboard() {
    const { portfolios, addPortfolio, setCurrentPortfolioId } = usePortfolios();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    const handleCreatePortfolio = (name: string, type: PortfolioType, color: string, icon: string) => {
        const id = addPortfolio(name, color, icon, type);
        setCurrentPortfolioId(id);
        setIsModalOpen(false);
        navigate(`/${type}/${id}`);
    };

    return (
        <div className="min-h-screen bg-background text-foreground py-8 px-4">
            <PortfolioCreationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreate={handleCreatePortfolio}
            />

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
                                Dashboard
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Overview of all your portfolios
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 flex-wrap">
                        <ModeToggle />
                    </div>
                </div>
            </motion.div>

            <DashboardStats />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {portfolios.map((portfolio, index) => (
                    <motion.div
                        key={portfolio.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 + 0.5 }} // Added delay to stagger after stats
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
                        onClick={() => setIsModalOpen(true)}
                    >
                        <div className="p-4 rounded-full bg-secondary">
                            <Plus className="w-6 h-6" />
                        </div>
                        <span className="text-lg font-medium">Create New Portfolio</span>
                    </Button>
                </motion.div>
            </div>
        </div>
    );
}
