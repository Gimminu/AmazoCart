import { CartItem } from './Cart';

export interface Order {
  order_id: string;
  user_id: number;
  total_amount: number;
  status: string;
  created_at: string;
  items: (CartItem & { price_at_order?: number })[];
}
