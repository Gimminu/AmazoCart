export interface Product {
  product_id: string;
  product_name: string;
  image: string;
  price: number;
  category_id?: number;
  category_name?: string; // joined category alias
  category?: string; // fallback when API returns "category"
  category_slug?: string;
  avg_rating?: number;
  review_count?: number;
  country_id?: string;
}
