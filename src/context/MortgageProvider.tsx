import { createContext, useContext, useCallback, ReactNode, useMemo } from 'react';
import { MortgagePlan, ExtraPayment, RateChange, AmortizationRow, GracePeriod } from '@/types';
import { CurrencyCode } from '@/lib/currency';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useMortgageCalculations } from '@/hooks/useMortgageCalculations';

import { parseMonth } from '@/lib/planUtils';

interface MortgageContextType {
    plans: MortgagePlan[];
    extraPayments: ExtraPayment[];
    rateChanges: RateChange[];
    gracePeriods: GracePeriod[];
    currency: CurrencyCode;
    amortizationRows: AmortizationRow[];
    setCurrency: (currency: CurrencyCode) => void;
    addPlan: (plan: Omit<MortgagePlan, 'id'>) => void;
    updatePlan: (plan: MortgagePlan) => void;
    deletePlan: (id: string) => void;
    addExtraPayment: (payment: Omit<ExtraPayment, 'id'>) => void;
    updateExtraPayment: (payment: ExtraPayment) => void;
    deleteExtraPayment: (id: string) => void;
    addRateChange: (rateChange: Omit<RateChange, 'id'>) => void;
    updateRateChange: (rateChange: RateChange) => void;
    deleteRateChange: (id: string) => void;
    addGracePeriod: (gracePeriod: Omit<GracePeriod, 'id'>) => void;
    updateGracePeriod: (gracePeriod: GracePeriod) => void;
    deleteGracePeriod: (id: string) => void;
    importData: (data: {
        plans: MortgagePlan[];
        extraPayments: ExtraPayment[];
        rateChanges: RateChange[];
        gracePeriods: GracePeriod[];
        currency: CurrencyCode;
    }) => void;
}

const MortgageContext = createContext<MortgageContextType | undefined>(undefined);

export function MortgageProvider({ children, portfolioId }: { children: ReactNode; portfolioId?: string }) {
    const suffix = portfolioId && portfolioId !== 'default' ? `-${portfolioId}` : '';

    const [plans, setPlans] = useLocalStorage<MortgagePlan[]>(`mortgage-plans${suffix}`, []);
    const [extraPayments, setExtraPayments] = useLocalStorage<ExtraPayment[]>(`mortgage-extra-payments${suffix}`, []);
    const [rateChanges, setRateChanges] = useLocalStorage<RateChange[]>(`mortgage-rate-changes${suffix}`, []);
    const [gracePeriods, setGracePeriods] = useLocalStorage<GracePeriod[]>(`mortgage-grace-periods${suffix}`, []);
    const [currency, setCurrency] = useLocalStorage<CurrencyCode>(`mortgage-currency${suffix}`, 'ILS');

    const amortizationRows = useMortgageCalculations(plans, extraPayments, rateChanges, gracePeriods, currency);



    const addPlan = useCallback((planData: Omit<MortgagePlan, 'id'>) => {
        const newPlan: MortgagePlan = {
            ...planData,
            enabled: true,
            id: `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        setPlans([...plans, newPlan]);
    }, [plans, setPlans]);

    const updatePlan = useCallback((updatedPlan: MortgagePlan) => {
        setPlans(plans.map((p) => (p.id === updatedPlan.id ? updatedPlan : p)));
    }, [plans, setPlans]);

    const deletePlan = useCallback((id: string) => {
        setPlans(plans.filter((p) => p.id !== id));
        setExtraPayments(extraPayments.filter((ep) => ep.planId !== id));
        setRateChanges(rateChanges.filter((rc) => rc.planId !== id));
        setGracePeriods(gracePeriods.filter((gp) => gp.planId !== id));
    }, [plans, extraPayments, rateChanges, gracePeriods, setPlans, setExtraPayments, setRateChanges, setGracePeriods]);

    const addExtraPayment = useCallback((paymentData: Omit<ExtraPayment, 'id'>) => {
        const newPayment: ExtraPayment = {
            ...paymentData,
            id: `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        setExtraPayments([...extraPayments, newPayment]);
    }, [extraPayments, setExtraPayments]);

    const updateExtraPayment = useCallback((updatedPayment: ExtraPayment) => {
        setExtraPayments(extraPayments.map((ep) => (ep.id === updatedPayment.id ? updatedPayment : ep)));
    }, [extraPayments, setExtraPayments]);

    const deleteExtraPayment = useCallback((id: string) => {
        setExtraPayments(extraPayments.filter((ep) => ep.id !== id));
    }, [extraPayments, setExtraPayments]);

    const addRateChange = useCallback((rateChangeData: Omit<RateChange, 'id'>) => {
        const newRateChange: RateChange = {
            ...rateChangeData,
            id: `rate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        setRateChanges([...rateChanges, newRateChange]);
    }, [rateChanges, setRateChanges]);

    const updateRateChange = useCallback((updatedRateChange: RateChange) => {
        setRateChanges(rateChanges.map((rc) => (rc.id === updatedRateChange.id ? updatedRateChange : rc)));
    }, [rateChanges, setRateChanges]);

    const deleteRateChange = useCallback((id: string) => {
        setRateChanges(rateChanges.filter((rc) => rc.id !== id));
    }, [rateChanges, setRateChanges]);

    const addGracePeriod = useCallback((gracePeriodData: Omit<GracePeriod, 'id'>) => {
        const newGracePeriod: GracePeriod = {
            ...gracePeriodData,
            id: `grace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        setGracePeriods([...gracePeriods, newGracePeriod]);
    }, [gracePeriods, setGracePeriods]);

    const updateGracePeriod = useCallback((updatedGracePeriod: GracePeriod) => {
        setGracePeriods(gracePeriods.map((gp) => (gp.id === updatedGracePeriod.id ? updatedGracePeriod : gp)));
    }, [gracePeriods, setGracePeriods]);

    const deleteGracePeriod = useCallback((id: string) => {
        setGracePeriods(gracePeriods.filter((gp) => gp.id !== id));
    }, [gracePeriods, setGracePeriods]);

    const importData = useCallback((data: {
        plans: MortgagePlan[];
        extraPayments: ExtraPayment[];
        rateChanges: RateChange[];
        gracePeriods: GracePeriod[];
        currency: CurrencyCode;
    }) => {
        setPlans(data.plans);
        setExtraPayments(data.extraPayments);
        setRateChanges(data.rateChanges);
        setGracePeriods(data.gracePeriods || []);
        setCurrency(data.currency);
    }, [setPlans, setExtraPayments, setRateChanges, setGracePeriods, setCurrency]);

    const calculatedPlans = useMemo(() => {
        const now = new Date();
        const currentMonthIndex = (now.getFullYear() - 2000) * 12 + now.getMonth();

        return plans.map(plan => {
            const planRows = amortizationRows.filter(r => r.planId === plan.id);
            const remainingMonths = planRows.filter(r => parseMonth(r.month) > currentMonthIndex).length;
            return { ...plan, remainingMonths };
        });
    }, [plans, amortizationRows]);

    const enabledPlansIds = useMemo(() => plans.filter(p => p.enabled).map(p => p.id), [plans]);

    const value = {
        plans: calculatedPlans,
        extraPayments: extraPayments.filter(e => e.enabled && enabledPlansIds.includes(e.planId)),
        rateChanges: rateChanges.filter(r => r.enabled && enabledPlansIds.includes(r.planId)),
        gracePeriods: gracePeriods.filter(g => g.enabled && enabledPlansIds.includes(g.planId)),
        currency,
        amortizationRows,
        setCurrency,
        addPlan,
        updatePlan,
        deletePlan,
        addExtraPayment,
        updateExtraPayment,
        deleteExtraPayment,
        addRateChange,
        updateRateChange,
        deleteRateChange,
        addGracePeriod,
        updateGracePeriod,
        deleteGracePeriod,
        importData,
    };

    return (
        <MortgageContext.Provider value={value}>
            {children}
        </MortgageContext.Provider>
    );
}

export function useMortgage() {
    const context = useContext(MortgageContext);
    if (context === undefined) {
        throw new Error('useMortgage must be used within a MortgageProvider');
    }
    return context;
}
