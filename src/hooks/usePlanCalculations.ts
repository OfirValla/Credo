import { useMemo } from 'react';
import { Plan, ExtraPayment, AmortizationRow, RateChange, GracePeriod } from '@/types';
import { CurrencyCode } from '@/lib/currency';
import { useCPI } from '@/hooks/useCPI';
import { calculateAmortizationSchedule } from '@/lib/mortgageCalculations';
import { useTranslation } from 'react-i18next';

export function usePlanCalculations(
  plans: Plan[],
  extraPayments: ExtraPayment[],
  rateChanges: RateChange[] = [],
  gracePeriods: GracePeriod[] = [],
  currency: CurrencyCode = 'USD'
): AmortizationRow[] {
  const cpiData = useCPI();
  const { t } = useTranslation('portfolio-page');

  return useMemo(() => {
    return calculateAmortizationSchedule(
      plans,
      extraPayments,
      rateChanges,
      gracePeriods,
      currency,
      cpiData,
      t
    );
  }, [plans, extraPayments, rateChanges, gracePeriods, currency, cpiData, t]);
}
