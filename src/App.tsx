import { motion } from 'framer-motion';
import { LayoutDashboard } from 'lucide-react';
import { DataExport } from '@/components/DataExport';
import { DataImport } from '@/components/DataImport';
import { PlanningSection } from '@/components/PlanningSection';
import { AffordabilityCalculator } from '@/components/AffordabilityCalculator';
import { CurrentMonthPreview } from '@/components/CurrentMonthPreview';
import { AmortizationTable } from '@/components/AmortizationTable';
import { MortgageStatus } from '@/components/MortgageStatus';
import { MortgageSummary } from '@/components/MortgageSummary';
import { CurrencySelector } from '@/components/CurrencySelector';
import { ModeToggle } from '@/components/ModeToggle';
import { ThemeProvider } from '@/context/ThemeProvider';
import { MortgageProvider } from '@/context/MortgageProvider';

function AppContent() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 overflow-x-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50 animate-pulse" />
        <div className="absolute top-40 -left-20 w-72 h-72 bg-secondary/20 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="w-full py-8 px-4">
        <motion.header
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
                  Mortgage Manager
                </h1>
                <p className="text-muted-foreground mt-1">
                  Smart analytics for your property investments
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 flex-wrap">
              <DataImport />
              <DataExport />
              <CurrencySelector />
              <ModeToggle />
            </div>
          </div>
        </motion.header>

        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
          {/* Column 1: Planning Phase */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <PlanningSection />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <AffordabilityCalculator />
            </motion.div>
          </div>

          {/* Column 2: Summary & Status */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <CurrentMonthPreview />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <MortgageSummary />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <MortgageStatus />
            </motion.div>
          </div>

          {/* Column 3: Amortization Table */}
          <div className="space-y-6 md:col-span-2 2xl:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <AmortizationTable />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { MortgagePortfolioProvider, useMortgagePortfolio } from '@/context/MortgagePortfolioContext';
import { Sidebar } from '@/components/Sidebar';

function AppWithPortfolio() {
  const { currentPortfolioId } = useMortgagePortfolio();

  return (
    <MortgageProvider key={currentPortfolioId} portfolioId={currentPortfolioId}>
      <Sidebar />
      <div className="pl-16 transition-all duration-300">
        <AppContent />
      </div>
    </MortgageProvider>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <MortgagePortfolioProvider>
        <AppWithPortfolio />
      </MortgagePortfolioProvider>
    </ThemeProvider>
  );
}

export default App;
