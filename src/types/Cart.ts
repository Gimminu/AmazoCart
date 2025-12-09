export interface CartItem {
  product_id: string;
  product_name: string;
  image: string;
  price: number;
  quantity: number;
  line_total?: number;
}
