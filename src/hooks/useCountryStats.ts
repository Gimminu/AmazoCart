import { useQuery } from '@tanstack/react-query';
import { fetchCountryStats } from '../lib/api';
import { CountryStat } from '../types/CountryStat';

export function useCountryStats() {
  return useQuery<CountryStat[]>({
    queryKey: ['country-stats'],
    queryFn: fetchCountryStats,
    staleTime: 1000 * 60 * 10
  });
}
