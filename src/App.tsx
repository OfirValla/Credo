import { useCallback } from 'react';
import { MortgagePlan, ExtraPayment, RateChange } from '@/types';
import { CurrencyCode } from '@/lib/currency';
import { MortgageForm } from '@/components/MortgageForm';
import { ExtraPaymentsForm } from '@/components/ExtraPaymentsForm';
import { RateChangeForm } from '@/components/RateChangeForm';
import { CurrentMonthPreview } from '@/components/CurrentMonthPreview';
import { AmortizationTable } from '@/components/AmortizationTable';
import { MortgageSummary } from '@/components/MortgageSummary';
import { CurrencySelector } from '@/components/CurrencySelector';
import { useMortgage } from '@/hooks/useMortgage';
import { useLocalStorage } from '@/hooks/useLocalStorage';

function App() {
  const [plans, setPlans] = useLocalStorage<MortgagePlan[]>('mortgage-plans', []);
  const [extraPayments, setExtraPayments] = useLocalStorage<ExtraPayment[]>('mortgage-extra-payments', []);
  const [rateChanges, setRateChanges] = useLocalStorage<RateChange[]>('mortgage-rate-changes', []);
  const [currency, setCurrency] = useLocalStorage<CurrencyCode>('mortgage-currency', 'USD');

  const amortizationRows = useMortgage(plans, extraPayments, rateChanges);

  const handleAddPlan = useCallback((planData: Omit<MortgagePlan, 'id'>) => {
    const newPlan: MortgagePlan = {
      ...planData,
      id: `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setPlans([...plans, newPlan]);
  }, [plans, setPlans]);

  const handleDeletePlan = useCallback((id: string) => {
    setPlans(plans.filter((p) => p.id !== id));
    // Also remove extra payments and rate changes for this plan
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Mortgage Manager</h1>
              <p className="text-muted-foreground">
                Manage multiple mortgage plans and extra payments with detailed amortization tables
              </p>
            </div>
            <CurrencySelector currency={currency} onCurrencyChange={setCurrency} />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <MortgageForm
            plans={plans}
            currency={currency}
            onAddPlan={handleAddPlan}
            onDeletePlan={handleDeletePlan}
          />
          <ExtraPaymentsForm
            plans={plans}
            currency={currency}
            extraPayments={extraPayments}
            onAddExtraPayment={handleAddExtraPayment}
            onDeleteExtraPayment={handleDeleteExtraPayment}
          />
          <RateChangeForm
            plans={plans}
            currency={currency}
            rateChanges={rateChanges}
            onAddRateChange={handleAddRateChange}
            onDeleteRateChange={handleDeleteRateChange}
          />
        </div>

        <div className="mb-6">
          <CurrentMonthPreview
            plans={plans}
            rows={amortizationRows}
            currency={currency}
          />
        </div>

        <div className="mb-6">
          <MortgageSummary
            rows={amortizationRows}
            plans={plans}
            currency={currency}
            extraPayments={extraPayments}
          />
        </div>

        <div className="mb-6">
          <AmortizationTable rows={amortizationRows} plans={plans} currency={currency} />
        </div>
      </div>
    </div>
  );
}

export default App;
