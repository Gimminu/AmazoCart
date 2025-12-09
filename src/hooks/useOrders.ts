import { useQuery } from '@tanstack/react-query';
import { fetchOrders } from '../lib/api';
import { Order } from '../types/Order';

export function useOrders(userId?: number) {
  return useQuery<Order[]>({
    queryKey: ['orders', userId],
    queryFn: () => fetchOrders(userId!),
    enabled: Boolean(userId)
  });
}
