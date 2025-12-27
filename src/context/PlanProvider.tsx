import { createContext, useContext, useCallback, ReactNode, useMemo } from 'react';
import { Plan, ExtraPayment, RateChange, AmortizationRow, GracePeriod } from '@/types';
import { CurrencyCode } from '@/lib/currency';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { usePlanCalculations } from '@/hooks/usePlanCalculations';

import { parseDateToMonthIndex } from '@/lib/planUtils';
import { useParams } from 'react-router';

interface PlanContextType {
    plans: Plan[];
    extraPayments: ExtraPayment[];
    rateChanges: RateChange[];
    gracePeriods: GracePeriod[];
    currency: CurrencyCode;
    amortizationRows: AmortizationRow[];
    setCurrency: (currency: CurrencyCode) => void;
    addPlan: (plan: Omit<Plan, 'id'>) => void;
    updatePlan: (plan: Plan) => void;
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
        plans: Plan[];
        extraPayments: ExtraPayment[];
        rateChanges: RateChange[];
        gracePeriods: GracePeriod[];
        currency: CurrencyCode;
    }) => void;
}

export const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function PlanProvider({ children, storagePrefix = 'mortgage' }: { children: ReactNode; storagePrefix?: string }) {
    const { portfolioId } = useParams();
    const suffix = `-${portfolioId}`;

    const [plans, setPlans] = useLocalStorage<Plan[]>(`${storagePrefix}-plans${suffix}`, []);
    const [extraPayments, setExtraPayments] = useLocalStorage<ExtraPayment[]>(`${storagePrefix}-extra-payments${suffix}`, []);
    const [rateChanges, setRateChanges] = useLocalStorage<RateChange[]>(`${storagePrefix}-rate-changes${suffix}`, []);
    const [gracePeriods, setGracePeriods] = useLocalStorage<GracePeriod[]>(`${storagePrefix}-grace-periods${suffix}`, []);
    const [currency, setCurrency] = useLocalStorage<CurrencyCode>(`${storagePrefix}-currency${suffix}`, 'ILS');

    const amortizationRows = usePlanCalculations(plans, extraPayments, rateChanges, gracePeriods, currency);

    const addPlan = useCallback((planData: Omit<Plan, 'id'>) => {
        const newPlan: Plan = {
            ...planData,
            enabled: true,
            id: `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        setPlans([...plans, newPlan]);
    }, [plans, setPlans]);

    const updatePlan = useCallback((updatedPlan: Plan) => {
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
        plans: Plan[];
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
        const currentMonthIndex = parseDateToMonthIndex(now.toLocaleDateString('en-GB'));

        return plans.map(plan => {
            const planRows = amortizationRows.filter(r => r.planId === plan.id);
            const remainingMonths = planRows.filter(r => parseDateToMonthIndex(r.month) > currentMonthIndex).length;
            return { ...plan, remainingMonths };
        });
    }, [plans, amortizationRows]);

    const enabledPlansIds = useMemo(() => plans.filter(p => p.enabled).map(p => p.id), [plans]);

    const value = {
        plans: calculatedPlans,
        extraPayments: extraPayments.filter(e => enabledPlansIds.includes(e.planId)),
        rateChanges: rateChanges.filter(r => enabledPlansIds.includes(r.planId)),
        gracePeriods: gracePeriods.filter(g => enabledPlansIds.includes(g.planId)),
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
        <PlanContext.Provider value={value}>
            {children}
        </PlanContext.Provider>
    );
}

export function usePlans() {
    const context = useContext(PlanContext);
    if (context === undefined) {
        throw new Error('usePlans must be used within a PlanProvider');
    }
    return context;
}
