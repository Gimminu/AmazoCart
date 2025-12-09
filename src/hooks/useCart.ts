import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCart, addToCart, updateCartItem, removeCartItem } from '../lib/api';
import { CartItem } from '../types/Cart';

export function useCart(userId?: number) {
  const queryClient = useQueryClient();
  const enabled = Boolean(userId);

  const cartQuery = useQuery<{ cart_id: number; items: CartItem[] }>({
    queryKey: ['cart', userId],
    queryFn: () => fetchCart(userId!),
    enabled
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['cart', userId] });

  const addMutation = useMutation({
    mutationFn: ({ productId, quantity = 1 }: { productId: string; quantity?: number }) =>
      addToCart(userId!, productId, quantity),
    onSuccess: invalidate
  });

  const updateMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      updateCartItem(userId!, productId, quantity),
    onSuccess: invalidate
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => removeCartItem(userId!, productId),
    onSuccess: invalidate
  });

  return { cartQuery, addMutation, updateMutation, removeMutation };
}
