import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Wallet, Percent, Hourglass } from 'lucide-react';
import { PlanForm } from './PlanForm';
import { ExtraPaymentsForm } from './ExtraPaymentsForm';
import { RateChangeForm } from './RateChangeForm';
import { GracePeriodForm } from './GracePeriodForm';
import { SlidingSelect } from '../ui/sliding-select';

import { useTranslation } from 'react-i18next';

type TabId = 'plans' | 'extra' | 'rates' | 'grace'; //| 'compare';

export function PlanningSection() {
    const { t } = useTranslation('portfolio-page');
    const [activeTab, setActiveTab] = useState<TabId>('plans');

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <SlidingSelect
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as TabId)}
                options={[
                    { value: 'plans', label: t('planning.tabs.plans'), icon: Home },
                    { value: 'extra', label: t('planning.tabs.extra'), icon: Wallet },
                    { value: 'rates', label: t('planning.tabs.rates'), icon: Percent },
                    { value: 'grace', label: t('planning.tabs.grace'), icon: Hourglass },
                    //{ value: 'compare', label: 'Compare', icon: GitCompare },
                ]}
                color="bg-indigo-500"
                textColor="text-primary-foreground"
            />

            {/* Content Area */}
            <div className="relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === 'plans' && <PlanForm />}
                        {activeTab === 'extra' && <ExtraPaymentsForm />}
                        {activeTab === 'rates' && <RateChangeForm />}
                        {activeTab === 'grace' && <GracePeriodForm />}
                        {/* {activeTab === 'compare' && (
                            <Card className="h-[400px] flex items-center justify-center text-muted-foreground" gradient>
                                <CardContent className="text-center space-y-4">
                                    <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto">
                                        <GitCompare className="w-8 h-8 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg text-foreground">Compare Plans</h3>
                                        <p className="text-sm">Compare different mortgage scenarios side by side.</p>
                                    </div>
                                    <div className="text-xs font-mono bg-secondary/50 px-3 py-1 rounded-full">
                                        Coming Soon
                                    </div>
                                </CardContent>
                            </Card>
                        )} */}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
