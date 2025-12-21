import { useMemo } from 'react';
import { MortgagePlan, ExtraPayment, AmortizationRow, RateChange, GracePeriod } from '@/types';
import { CurrencyCode } from '@/lib/currency';
import { useCPI } from '@/hooks/useCPI';
import { calculateAmortizationSchedule } from '@/lib/mortgageCalculations';

export function useMortgageCalculations(
  plans: MortgagePlan[],
  extraPayments: ExtraPayment[],
  rateChanges: RateChange[] = [],
  gracePeriods: GracePeriod[] = [],
  currency: CurrencyCode = 'USD'
): AmortizationRow[] {
  const cpiData = useCPI();

  return useMemo(() => {
    return calculateAmortizationSchedule(
      plans,
      extraPayments,
      rateChanges,
      gracePeriods,
      currency,
      cpiData
    );
  }, [plans, extraPayments, rateChanges, gracePeriods, currency, cpiData]);
}