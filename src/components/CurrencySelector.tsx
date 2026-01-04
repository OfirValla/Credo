import { CurrencyCode, CURRENCIES } from '@/lib/currency';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { usePlans } from '@/context/PlanProvider';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

export function CurrencySelector() {
  const { t } = useTranslation('portfolio-page');
  const { currency, setCurrency } = usePlans();
  const currencyOptions = CURRENCIES.map((curr) => ({
    value: curr.code,
    label: `${curr.symbol} ${curr.code} - ${t(`currencies.${curr.code}`)}`,
  }));

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="currency-selector" className="text-sm font-medium hidden sm:block">
        {t('currency')}:
      </Label>
      <Select
        value={currency}
        onValueChange={(value) => {
          setCurrency(value as CurrencyCode);
          toast.info("The site does not automatically convert between currencies");
        }}
        options={currencyOptions}
        className="w-[140px] sm:w-[180px]"
      />
    </div>
  );
}
