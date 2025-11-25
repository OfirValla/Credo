import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard } from 'lucide-react';
import { MortgagePlan, ExtraPayment, RateChange } from '@/types';
import { CurrencyCode } from '@/lib/currency';
import { DataExport } from '@/components/DataExport';
import { DataImport } from '@/components/DataImport';
import { MortgageForm } from '@/components/MortgageForm';
import { ExtraPaymentsForm } from '@/components/ExtraPaymentsForm';
import { RateChangeForm } from '@/components/RateChangeForm';
import { CurrentMonthPreview } from '@/components/CurrentMonthPreview';
import { AmortizationTable } from '@/components/AmortizationTable';
import { MortgageStatus } from '@/components/MortgageStatus';
import { MortgageSummary } from '@/components/MortgageSummary';
import { CurrencySelector } from '@/components/CurrencySelector';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ModeToggle } from '@/components/ModeToggle';
import { useMortgage } from '@/hooks/useMortgage';
import { useLocalStorage } from '@/hooks/useLocalStorage';

function App() {
  const [plans, setPlans] = useLocalStorage<MortgagePlan[]>('mortgage-plans', []);
  const [extraPayments, setExtraPayments] = useLocalStorage<ExtraPayment[]>('mortgage-extra-payments', []);
  const [rateChanges, setRateChanges] = useLocalStorage<RateChange[]>('mortgage-rate-changes', []);
  const [currency, setCurrency] = useLocalStorage<CurrencyCode>('mortgage-currency', 'USD');

  const amortizationRows = useMortgage(plans, extraPayments, rateChanges, currency);

  const handleAddPlan = useCallback((planData: Omit<MortgagePlan, 'id'>) => {
    const newPlan: MortgagePlan = {
      ...planData,
      id: `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setPlans([...plans, newPlan]);
  }, [plans, setPlans]);

  const handleDeletePlan = useCallback((id: string) => {
    setPlans(plans.filter((p) => p.id !== id));
    setExtraPayments(extraPayments.filter((ep) => ep.planId !== id));
    setRateChanges(rateChanges.filter((rc) => rc.planId !== id));
  }, [plans, extraPayments, rateChanges, setPlans, setExtraPayments, setRateChanges]);

  const handleAddExtraPayment = useCallback((paymentData: Omit<ExtraPayment, 'id'>) => {
    const newPayment: ExtraPayment = {
      ...paymentData,
      id: `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setExtraPayments([...extraPayments, newPayment]);
  }, [extraPayments, setExtraPayments]);

  const handleDeleteExtraPayment = useCallback((id: string) => {
    setExtraPayments(extraPayments.filter((ep) => ep.id !== id));
  }, [extraPayments, setExtraPayments]);

  const handleAddRateChange = useCallback((rateChangeData: Omit<RateChange, 'id'>) => {
    const newRateChange: RateChange = {
      ...rateChangeData,
      id: `rate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setRateChanges([...rateChanges, newRateChange]);
  }, [rateChanges, setRateChanges]);

  const handleDeleteRateChange = useCallback((id: string) => {
    setRateChanges(rateChanges.filter((rc) => rc.id !== id));
  }, [rateChanges, setRateChanges]);

  const handleUpdatePlan = useCallback((updatedPlan: MortgagePlan) => {
    setPlans(plans.map((p) => (p.id === updatedPlan.id ? updatedPlan : p)));
  }, [plans, setPlans]);

  const handleUpdateExtraPayment = useCallback((updatedPayment: ExtraPayment) => {
    setExtraPayments(extraPayments.map((ep) => (ep.id === updatedPayment.id ? updatedPayment : ep)));
  }, [extraPayments, setExtraPayments]);

  const handleUpdateRateChange = useCallback((updatedRateChange: RateChange) => {
    setRateChanges(rateChanges.map((rc) => (rc.id === updatedRateChange.id ? updatedRateChange : rc)));
  }, [rateChanges, setRateChanges]);

  const handleImport = useCallback((data: {
    plans: MortgagePlan[];
    extraPayments: ExtraPayment[];
    rateChanges: RateChange[];
    currency: CurrencyCode;
  }) => {
    setPlans(data.plans);
    setExtraPayments(data.extraPayments);
    setRateChanges(data.rateChanges);
    setCurrency(data.currency);
  }, [setPlans, setExtraPayments, setRateChanges, setCurrency]);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
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
              <div className="flex items-center gap-3 flex-wrap">
                <DataImport onImport={handleImport} />
                <DataExport />
                <CurrencySelector currency={currency} onCurrencyChange={setCurrency} />
                <ModeToggle />
              </div>
            </div>
          </motion.header>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {/* Column 1: Planning Phase */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <MortgageForm
                  plans={plans}
                  currency={currency}
                  onAddPlan={handleAddPlan}
                  onUpdatePlan={handleUpdatePlan}
                  onDeletePlan={handleDeletePlan}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <ExtraPaymentsForm
                  plans={plans}
                  currency={currency}
                  extraPayments={extraPayments}
                  onAddExtraPayment={handleAddExtraPayment}
                  onUpdateExtraPayment={handleUpdateExtraPayment}
                  onDeleteExtraPayment={handleDeleteExtraPayment}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <RateChangeForm
                  plans={plans}
                  currency={currency}
                  rateChanges={rateChanges}
                  onAddRateChange={handleAddRateChange}
                  onUpdateRateChange={handleUpdateRateChange}
                  onDeleteRateChange={handleDeleteRateChange}
                />
              </motion.div>
            </div>

            {/* Wrapper for Preview + Amortization */}
            {/* Tablet: Col 2 (Stacked) | Desktop: Cols 2 & 3 (Side by Side) */}
            <div className="space-y-6 xl:col-span-2 xl:grid xl:grid-cols-2 xl:gap-8 xl:space-y-0">
              {/* Column 2 (Desktop): Preview */}
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <CurrentMonthPreview
                    plans={plans}
                    rows={amortizationRows}
                    currency={currency}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <MortgageSummary
                    rows={amortizationRows}
                    plans={plans}
                    currency={currency}
                    extraPayments={extraPayments}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <MortgageStatus
                    rows={amortizationRows}
                    plans={plans}
                    currency={currency}
                  />
                </motion.div>
              </div>

              {/* Column 3 (Desktop): Amortization Table */}
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <AmortizationTable
                    rows={amortizationRows}
                    plans={plans}
                    currency={currency}
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
