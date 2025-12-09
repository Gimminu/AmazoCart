import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { fetchProducts, fetchProductsByCountry } from '../lib/api';
import { Product } from '../types/Product';
import { useUserRegion } from './useUserRegion';

export function useProducts(
  params: Record<string, any> = {},
  options?: Partial<UseQueryOptions<Product[]>>
) {
  const { country } = useUserRegion();
  return useQuery<Product[]>({
    queryKey: ['products', { ...params, country }],
    queryFn: () => fetchProductsByCountry(country, params),
    staleTime: 5 * 60 * 1000,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    ...options
  });
}
