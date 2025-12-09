import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../hooks/useCart';
import { checkout } from '../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export default function Cart() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { cartQuery, updateMutation, removeMutation } = useCart(user?.user_id);
  const { data, isLoading } = cartQuery;
  const { t } = useTranslation();

  const checkoutMutation = useMutation({
    mutationFn: () => checkout(user!.user_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.user_id] });
      queryClient.invalidateQueries({ queryKey: ['orders', user?.user_id] });
    }
  });

  if (!user) {
    return (
      <div className="bg-white rounded shadow-product p-4">
        <h1 className="text-xl font-semibold mb-2">{t('cart.title')}</h1>
        <p className="text-sm text-gray-700">
          {t('cart.login')} <Link className="text-amazonBlue hover:underline" to="/login">Login</Link>
        </p>
      </div>
    );
  }

  const items = data?.items || [];
  const subtotal = items.reduce((sum, i) => sum + (i.line_total ?? i.price * i.quantity), 0);

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="md:col-span-2 space-y-3">
        <div className="bg-white rounded shadow-product p-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{t('cart.title')}</h1>
            <p className="text-sm text-gray-600">User: {user.email}</p>
          </div>
        </div>

        <div className="bg-white rounded shadow-product p-4 space-y-3">
          {isLoading && <div>로딩 중...</div>}
          {!isLoading && items.length === 0 && <div className="text-sm text-gray-700">{t('cart.empty')}</div>}
          {items.map((item) => (
            <div key={item.product_id} className="flex justify-between items-center text-sm text-gray-800 border-b pb-2">
              <div className="flex-1">
                <div className="font-medium">{item.product_name}</div>
                <div className="text-gray-600">수량: {item.quantity}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-2 py-1 border rounded"
                  onClick={() => updateMutation.mutate({ productId: item.product_id, quantity: item.quantity - 1 })}
                  disabled={item.quantity <= 1}
                >-</button>
                <button
                  className="px-2 py-1 border rounded"
                  onClick={() => updateMutation.mutate({ productId: item.product_id, quantity: item.quantity + 1 })}
                >+</button>
                <button
                  className="text-xs text-red-600 hover:underline"
                  onClick={() => removeMutation.mutate(item.product_id)}
                >
                  삭제
                </button>
              </div>
              <div className="font-semibold w-24 text-right">
                {(item.line_total ?? item.price * item.quantity).toLocaleString()} 원
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded shadow-product p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span>{t('cart.subtotal')}</span>
          <span className="font-semibold">{subtotal.toLocaleString()} 원</span>
        </div>
        <button
          disabled={items.length === 0 || checkoutMutation.isLoading}
          onClick={() => checkoutMutation.mutate()}
          className="w-full bg-amazonYellow hover:bg-amazonOrange text-black font-medium py-2 rounded disabled:opacity-60"
        >
          {checkoutMutation.isLoading ? '...' : t('cart.checkout')}
        </button>
        <p className="text-xs text-gray-600">
          결제 시 orders/order_items로 이동하고 장바구니는 비워집니다.
        </p>
      </div>
    </div>
  );
}
