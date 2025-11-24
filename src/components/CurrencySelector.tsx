import { CurrencyCode, CURRENCIES } from '@/lib/currency';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/custom-select';

interface CurrencySelectorProps {
  currency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
}

export function CurrencySelector({ currency, onCurrencyChange }: CurrencySelectorProps) {
  const currencyOptions = CURRENCIES.map((curr) => ({
    value: curr.code,
    label: `${curr.symbol} ${curr.code} - ${curr.name}`,
  }));

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="currency-selector" className="text-sm font-medium hidden sm:block">
        Currency:
      </Label>
      <Select
        value={currency}
        onValueChange={(value) => onCurrencyChange(value as CurrencyCode)}
        options={currencyOptions}
        className="w-[140px] sm:w-[180px]"
      />
    </div>
  );
}
