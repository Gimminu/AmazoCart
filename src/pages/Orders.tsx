import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../hooks/useOrders';
import { useTranslation } from 'react-i18next';

export default function Orders() {
  const { user } = useAuth();
  const { data, isLoading } = useOrders(user?.user_id);
  const { t } = useTranslation();

  if (!user) {
    return (
      <div className="bg-white rounded shadow-product p-4">
        <h1 className="text-xl font-semibold mb-2">{t('orders.title')}</h1>
        <p className="text-sm text-gray-700">
          {t('cart.login')} <Link className="text-amazonBlue hover:underline" to="/login">Login</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded shadow-product p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t('orders.title')}</h1>
          <p className="text-sm text-gray-600">User: {user.email}</p>
        </div>
        <Link to="/cart" className="text-sm text-amazonBlue hover:underline">장바구니</Link>
      </div>

      <div className="bg-white rounded shadow-product p-4 text-sm text-gray-700 space-y-3">
        {isLoading && <div>주문을 불러오는 중...</div>}
        {!isLoading && (!data || data.length === 0) && <div>{t('orders.empty')}</div>}
        {data?.map(order => (
          <div key={order.order_id} className="border-b pb-3 last:border-b-0">
            <div className="flex justify-between">
              <div className="font-semibold">주문번호: {order.order_id}</div>
              <div className="text-xs text-gray-600">{order.created_at}</div>
            </div>
            <div className="text-sm text-gray-700">상태: {order.status} · 합계: {order.total_amount.toLocaleString()} 원</div>
            <div className="mt-2 space-y-1">
              {order.items?.map(item => (
                <div key={item.product_id} className="flex justify-between text-xs text-gray-700">
                  <span>{item.product_name || item.product_id} x {item.quantity}</span>
                  <span>{(item.price_at_order ?? item.line_total ?? 0).toLocaleString()} 원</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
