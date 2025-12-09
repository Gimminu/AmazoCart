export interface CountryStat {
  country_id: string;
  country: string;
  product_count: number;
  avg_price: number | null;
  avg_rating: number | null;
}
