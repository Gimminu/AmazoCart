import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '../lib/api';
import { Category } from '../types/Category';
import { useUserRegion } from './useUserRegion';

export function useCategories() {
  const { country } = useUserRegion();
  return useQuery<Category[]>({
    queryKey: ['categories', country],
    queryFn: () => fetchCategories(country),
    staleTime: 1000 * 60 * 5
  });
}
