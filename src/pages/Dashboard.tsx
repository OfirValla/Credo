import { motion } from 'framer-motion';
import { LayoutDashboard, Plus } from 'lucide-react';
import { usePortfolios } from '@/context/PortfolioContext';
import { PortfolioSummaryCard } from '@/components/PortfolioSummaryCard';
import { Button } from '@/components/ui/button';

export function Dashboard() {
    const { portfolios, addPortfolio, setCurrentPortfolioId } = usePortfolios();

    const handleCreatePortfolio = () => {
        const name = `New Portfolio ${portfolios.length + 1}`;
        const id = addPortfolio(name);
        setCurrentPortfolioId(id);
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10"
            >
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-primary/10 rounded-xl backdrop-blur-sm border border-primary/20">
                        <LayoutDashboard className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gradient">
                            Dashboard
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Overview of all your mortgage portfolios
                        </p>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {portfolios.map((portfolio, index) => (
                    <motion.div
                        key={portfolio.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <PortfolioSummaryCard portfolio={portfolio} />
                    </motion.div>
                ))}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: portfolios.length * 0.1 }}
                >
                    <Button
                        variant="outline"
                        className="w-full h-full min-h-[200px] border-dashed flex flex-col gap-4 hover:border-primary hover:bg-primary/5 transition-all"
                        onClick={handleCreatePortfolio}
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
