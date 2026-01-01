export type CurrencyCode = 'ILS' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'CNY' | 'INR' | 'BRL';

export interface Currency {
  code: CurrencyCode;
  symbol: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'ILS', symbol: '₪' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'JPY', symbol: '¥' },
  { code: 'CAD', symbol: 'C$' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'CHF', symbol: 'CHF' },
  { code: 'CNY', symbol: '¥' },
  { code: 'INR', symbol: '₹' },
  { code: 'BRL', symbol: 'R$' },
];

export function formatCurrency(value: number, currency: CurrencyCode = 'USD'): string {
  // Get locale based on currency
  const localeMap: Record<CurrencyCode, string> = {
    ILS: 'he-IL',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    JPY: 'ja-JP',
    CAD: 'en-CA',
    AUD: 'en-AU',
    CHF: 'de-CH',
    CNY: 'zh-CN',
    INR: 'en-IN',
    BRL: 'pt-BR',
  };

  const locale = localeMap[currency] || 'en-US';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function getCurrencySymbol(currency: CurrencyCode): string {
  const currencyObj = CURRENCIES.find(c => c.code === currency);
  return currencyObj?.symbol || '$';
}
