import { useMemo } from 'react';
import { useUserRegion } from './useUserRegion';
import { REGION_MAP } from '../constants/regions';
import { COUNTRY_METADATA } from '../constants/countries';

export function useCurrencyFormatter() {
  const { country } = useUserRegion();

  const formatter = useMemo(() => {
    const regionInfo = REGION_MAP[country];
    const meta = COUNTRY_METADATA[country as keyof typeof COUNTRY_METADATA];
    const currency = regionInfo?.currency || meta?.currency || 'USD';
    const locale = meta?.locale;
    return new Intl.NumberFormat(locale || undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'INR' ? 0 : 2
    });
  }, [country]);

  const format = (value: number) => formatter.format(value);

  const resolvedCurrency =
    REGION_MAP[country]?.currency ||
    COUNTRY_METADATA[country as keyof typeof COUNTRY_METADATA]?.currency ||
    'USD';
  return { format, currency: resolvedCurrency };
}
