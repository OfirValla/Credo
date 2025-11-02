import { CurrencyCode, CURRENCIES } from '@/lib/currency';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

interface CurrencySelectorProps {
  currency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
}

export function CurrencySelector({ currency, onCurrencyChange }: CurrencySelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="currency-selector" className="text-sm font-medium">
        Currency:
      </Label>
      <Select
        id="currency-selector"
        value={currency}
        onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
        className="w-[180px]"
      >
        {CURRENCIES.map((curr) => (
          <option key={curr.code} value={curr.code}>
            {curr.symbol} {curr.code} - {curr.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
