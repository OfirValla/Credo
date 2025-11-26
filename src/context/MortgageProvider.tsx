import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { MortgagePlan, ExtraPayment, RateChange, AmortizationRow } from '@/types';
import { CurrencyCode } from '@/lib/currency';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useMortgageCalculations } from '@/hooks/useMortgageCalculations';

interface MortgageContextType {
    plans: MortgagePlan[];
    extraPayments: ExtraPayment[];
    rateChanges: RateChange[];
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
    importData: (data: {
        plans: MortgagePlan[];
        extraPayments: ExtraPayment[];
        rateChanges: RateChange[];
        currency: CurrencyCode;
    }) => void;
}

const MortgageContext = createContext<MortgageContextType | undefined>(undefined);

export function MortgageProvider({ children }: { children: ReactNode }) {
    const [plans, setPlans] = useLocalStorage<MortgagePlan[]>('mortgage-plans', []);
    const [extraPayments, setExtraPayments] = useLocalStorage<ExtraPayment[]>('mortgage-extra-payments', []);
    const [rateChanges, setRateChanges] = useLocalStorage<RateChange[]>('mortgage-rate-changes', []);
    const [currency, setCurrency] = useLocalStorage<CurrencyCode>('mortgage-currency', 'USD');

    const amortizationRows = useMortgageCalculations(plans, extraPayments, rateChanges, currency);

    const addPlan = useCallback((planData: Omit<MortgagePlan, 'id'>) => {
        const newPlan: MortgagePlan = {
            ...planData,
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
    }, [plans, extraPayments, rateChanges, setPlans, setExtraPayments, setRateChanges]);

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

    const importData = useCallback((data: {
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

    const value = {
        plans,
        extraPayments,
        rateChanges,
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
