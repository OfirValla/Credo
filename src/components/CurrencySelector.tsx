import { CurrencyCode, CURRENCIES } from '@/lib/currency';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { usePlans } from '@/context/PlanProvider';
import { useTranslation } from 'react-i18next';

export function CurrencySelector() {
  const { t } = useTranslation('portfolio-page');
  const { currency, setCurrency } = usePlans();
  const currencyOptions = CURRENCIES.map((curr) => ({
    value: curr.code,
    label: `${curr.symbol} ${curr.code} - ${curr.name}`,
  }));

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="currency-selector" className="text-sm font-medium hidden sm:block">
        {t('currency')}:
      </Label>
      <Select
        value={currency}
        onValueChange={(value) => setCurrency(value as CurrencyCode)}
        options={currencyOptions}
        className="w-[140px] sm:w-[180px]"
      />
    </div>
  );
}
