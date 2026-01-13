import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Plus, CheckCircle2, Sparkles, Target, ShieldCheck } from 'lucide-react';

interface DashboardWelcomeProps {
    onCreatePortfolio: () => void;
}

export function DashboardWelcome({ onCreatePortfolio }: DashboardWelcomeProps) {
    const { t } = useTranslation('dashboard');
    const features = t('welcome.features', { returnObjects: true }) as string[];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="relative min-h-[80vh] flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-5xl w-full space-y-12"
            >
                {/* Hero / Header */}
                <motion.div variants={itemVariants} className="text-center space-y-6">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                        <span className="bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
                            {t('welcome.title')}
                        </span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        {t('welcome.intro')}
                    </p>
                </motion.div>

                {/* Problem & Solution Cards */}
                <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-6">
                    <div className="group p-8 bg-card/50 backdrop-blur-md border border-border/50 rounded-3xl hover:border-primary/20 hover:bg-card/80 transition-all duration-300 shadow-sm hover:shadow-lg">
                        <div className="w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center mb-6 text-destructive group-hover:scale-110 transition-transform">
                            <Target className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3">{t('welcome.problemTitle') || "The Problem"}</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            {t('welcome.problem')}
                        </p>
                    </div>

                    <div className="group p-8 bg-card/50 backdrop-blur-md border border-border/50 rounded-3xl hover:border-primary/20 hover:bg-card/80 transition-all duration-300 shadow-sm hover:shadow-lg">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3">{t('welcome.solutionTitle') || "The Solution"}</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            {t('welcome.solution')}
                        </p>
                    </div>
                </motion.div>

                {/* Features Grid */}
                <motion.div variants={itemVariants} className="space-y-8">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-2">{t('welcome.featuresTitle')}</h2>
                        <div className="h-1 w-20 bg-primary/30 mx-auto rounded-full" />
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                variants={itemVariants}
                                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                                className="flex items-start gap-4 p-4 rounded-2xl bg-secondary/30 border border-transparent hover:border-primary/10 hover:bg-secondary/50 transition-colors"
                            >
                                <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-background shadow-sm flex items-center justify-center text-primary">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                                <span className="text-sm md:text-base font-medium text-foreground/80">{feature}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* CTA Section */}
                <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-secondary/10 border border-primary/10 p-8 md:p-12 text-center">
                    <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                        <div className="space-y-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-background shadow-sm mb-4">
                                <ShieldCheck className="w-8 h-8 text-primary" />
                            </div>
                            <p className="text-lg text-muted-foreground">
                                {t('welcome.conclusion')}
                            </p>
                            <p className="font-medium text-primary">
                                {t('welcome.cta')}
                            </p>
                        </div>

                        <Button
                            size="lg"
                            onClick={onCreatePortfolio}
                            className="text-lg px-8 py-6 h-auto rounded-full shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-105"
                        >
                            <Plus className="mr-2 h-5 w-5" />
                            {t('createPortfolio')}
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
